// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const notifyEllaEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      event_type: z.string(),
      payload: z.any(),
      message: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await supabaseAdmin.from("ella_actions_log").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      action_type: `webhook_${data.event_type}`,
      details: data.payload,
      status: "success",
    });

    return { success: true };
  });
