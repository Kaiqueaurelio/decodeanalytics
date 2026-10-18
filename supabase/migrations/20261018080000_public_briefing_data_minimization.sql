-- Public briefing links should return only customer-facing fields.
-- Keep the response shape used by /briefing/$token while never serializing whole rows.
CREATE OR REPLACE FUNCTION public.get_public_briefing(_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  result JSONB;
  link_row public.briefing_links;
BEGIN
  SELECT * INTO link_row
  FROM public.briefing_links
  WHERE token = _token
    AND active
    AND (expires_at IS NULL OR expires_at > now());

  IF link_row.id IS NULL THEN
    RAISE EXCEPTION 'Link invalido ou expirado';
  END IF;

  UPDATE public.briefing_links
  SET last_accessed_at = now()
  WHERE id = link_row.id;

  SELECT jsonb_build_object(
    'link', jsonb_build_object(
      'id', link_row.id,
      'token', link_row.token,
      'order_id', link_row.order_id,
      'quote_id', link_row.quote_id
    ),
    'order', (
      SELECT jsonb_build_object('number', o.number, 'client_name', c.name)
      FROM public.orders o
      JOIN public.clients c ON c.id = o.client_id
      WHERE o.id = link_row.order_id
    ),
    'quote', (
      SELECT jsonb_build_object('number', q.number, 'client_name', c.name)
      FROM public.quotes q
      JOIN public.clients c ON c.id = q.client_id
      WHERE q.id = link_row.quote_id
    ),
    'briefing', (
      SELECT jsonb_build_object(
        'client_name', b.client_name,
        'whatsapp', b.whatsapp,
        'product_type', b.product_type,
        'quantity', b.quantity,
        'desired_deadline', b.desired_deadline,
        'observations', b.observations,
        'answers', b.answers,
        'submitted_at', b.submitted_at,
        'updated_at', b.updated_at
      )
      FROM public.client_briefings b
      WHERE b.link_id = link_row.id
    ),
    'files', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', f.id,
        'category', f.category,
        'storage_path', f.storage_path,
        'file_name', f.file_name,
        'mime_type', f.mime_type,
        'size_bytes', f.size_bytes,
        'uploaded_by_client', f.uploaded_by_client,
        'created_at', f.created_at
      ) ORDER BY f.created_at DESC)
      FROM public.briefing_files f
      WHERE f.link_id = link_row.id
    ), '[]'::jsonb),
    'versions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', v.id,
        'version_number', v.version_number,
        'title', v.title,
        'storage_path', v.storage_path,
        'file_name', v.file_name,
        'mime_type', v.mime_type,
        'size_bytes', v.size_bytes,
        'notes', v.notes,
        'status', v.status,
        'client_comment', v.client_comment,
        'reviewed_at', v.reviewed_at,
        'created_at', v.created_at,
        'comments', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', ac.id,
            'author_type', ac.author_type,
            'author_name', ac.author_name,
            'comment', ac.comment,
            'marker_x', ac.marker_x,
            'marker_y', ac.marker_y,
            'created_at', ac.created_at
          ) ORDER BY ac.created_at)
          FROM public.art_comments ac
          WHERE ac.art_version_id = v.id
        ), '[]'::jsonb)
      ) ORDER BY v.version_number DESC)
      FROM public.art_versions v
      WHERE v.link_id = link_row.id
        AND v.status <> 'rascunho'
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;
