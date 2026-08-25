import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { brl, DEFAULT_COMPANY_DOCUMENT, fmtCnpj, fmtDate } from "./format";

interface Company {
  name: string;
  whatsapp?: string | null;
  instagram?: string | null;
  address?: string | null;
  document?: string | null;
  logo_url?: string | null;
}

interface Item {
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

async function loadLogo(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function header(doc: jsPDF, company: Company, title: string, logoData: string | null) {
  doc.setFillColor(34, 38, 70);
  doc.rect(0, 0, 210, 32, "F");
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", 14, 5, 22, 22, undefined, "FAST");
    } catch {
      /* ignore invalid logo */
    }
  }
  const textX = logoData ? 40 : 14;
  doc.setTextColor(255, 215, 130);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(company.name, textX, 14);
  doc.setTextColor(245, 245, 245);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const contact = [
    `CNPJ: ${fmtCnpj(company.document || DEFAULT_COMPANY_DOCUMENT)}`,
    company.whatsapp ? `WhatsApp: ${company.whatsapp}` : null,
    company.instagram ? `Instagram: ${company.instagram}` : null,
  ]
    .filter(Boolean)
    .join("   •   ");
  if (contact) doc.text(contact, textX, 21);
  if (company.address) {
    const lines = doc.splitTextToSize(company.address, 160);
    doc.text(lines, textX, 27);
  }
  doc.setTextColor(34, 38, 70);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, 14, 42);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.line(14, 44, 196, 44);
  doc.setLineWidth(0.2);
}

function footer(doc: jsPDF, company: Company) {
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(34, 38, 70);
  doc.rect(0, h - 22, 210, 22, "F");
  doc.setTextColor(255, 215, 130);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(company.name, 14, h - 14);
  doc.setTextColor(240);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const line1 = [
    `CNPJ ${fmtCnpj(company.document || DEFAULT_COMPANY_DOCUMENT)}`,
    company.whatsapp ? `WhatsApp ${company.whatsapp}` : null,
    company.instagram ? `Instagram ${company.instagram}` : null,
  ]
    .filter(Boolean)
    .join("   •   ");
  if (line1) doc.text(line1, 14, h - 9);
  if (company.address) {
    const lines = doc.splitTextToSize(company.address, 180);
    doc.text(lines, 14, h - 4);
  }
  doc.setTextColor(200);
  doc.setFontSize(7);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 196, h - 4, { align: "right" });
}

export async function generateOrderPDF(opts: {
  company: Company;
  order: {
    number: number; created_at: string; deadline?: string | null;
    description?: string | null; client_notes?: string | null;
    total: number; paid: number; payment_method?: string | null;
    production_status: string; urgent?: boolean;
  };
  client: { name: string; document?: string | null; whatsapp?: string | null; email?: string | null };
  items: Item[];
}) {
  const doc = new jsPDF();
  const logo = await loadLogo(opts.company.logo_url);
  header(doc, opts.company, `Ordem de Serviço #${opts.order.number}`, logo);

  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(50);
  doc.text(`Emissão: ${fmtDate(opts.order.created_at)}`, 14, 52);
  doc.text(`Prazo de entrega: ${fmtDate(opts.order.deadline)}`, 80, 52);
  if (opts.order.urgent) {
    doc.setTextColor(200, 30, 30); doc.setFont("helvetica", "bold");
    doc.text("URGENTE", 170, 52);
    doc.setTextColor(50); doc.setFont("helvetica", "normal");
  }

  doc.setFont("helvetica", "bold"); doc.text("Cliente", 14, 62);
  doc.setFont("helvetica", "normal");
  doc.text(opts.client.name, 14, 68);
  doc.text(
    [opts.client.document, opts.client.whatsapp, opts.client.email].filter(Boolean).join("  •  "),
    14, 74,
  );

  autoTable(doc, {
    startY: 82,
    head: [["Descrição", "Qtd", "Unit.", "Subtotal"]],
    body: opts.items.map((i) => [i.description, String(i.quantity), brl(i.unit_price), brl(i.subtotal)]),
    headStyles: { fillColor: [34, 38, 70], textColor: 255 },
    styles: { fontSize: 9 },
  });

  const y = (doc as any).lastAutoTable.finalY + 8;
  const remaining = (opts.order.total || 0) - (opts.order.paid || 0);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${brl(opts.order.total)}`, 140, y);
  doc.text(`Pago: ${brl(opts.order.paid)}`, 140, y + 6);
  doc.text(`Restante: ${brl(remaining)}`, 140, y + 12);
  doc.setFont("helvetica", "normal");
  if (opts.order.payment_method) doc.text(`Pagamento: ${opts.order.payment_method}`, 14, y);

  if (opts.order.description) {
    doc.setFont("helvetica", "bold"); doc.text("Detalhes", 14, y + 24);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(opts.order.description, 180), 14, y + 30);
  }

  doc.setDrawColor(180);
  doc.line(14, 248, 90, 248); doc.setFontSize(9); doc.text("Assinatura do cliente", 14, 254);
  doc.line(110, 248, 196, 248); doc.text("Assinatura responsável", 110, 254);

  footer(doc, opts.company);
  doc.save(`OS-${opts.order.number}.pdf`);
}

export async function generateQuotePDF(opts: {
  company: Company;
  quote: { number: number; created_at: string; validity_date?: string | null; total: number; notes?: string | null; discount: number };
  client: { name: string; document?: string | null; whatsapp?: string | null; email?: string | null };
  items: Item[];
}) {
  const doc = new jsPDF();
  const logo = await loadLogo(opts.company.logo_url);
  header(doc, opts.company, `Orçamento #${opts.quote.number}`, logo);
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(50);
  doc.text(`Data: ${fmtDate(opts.quote.created_at)}`, 14, 52);
  doc.text(`Validade: ${fmtDate(opts.quote.validity_date)}`, 80, 52);

  doc.setFont("helvetica", "bold"); doc.text("Cliente", 14, 62);
  doc.setFont("helvetica", "normal");
  doc.text(opts.client.name, 14, 68);
  doc.text(
    [opts.client.document, opts.client.whatsapp, opts.client.email].filter(Boolean).join("  •  "),
    14, 74,
  );

  autoTable(doc, {
    startY: 82,
    head: [["Descrição", "Qtd", "Unit.", "Subtotal"]],
    body: opts.items.map((i) => [i.description, String(i.quantity), brl(i.unit_price), brl(i.subtotal)]),
    headStyles: { fillColor: [34, 38, 70], textColor: 255 },
    styles: { fontSize: 9 },
  });
  const y = (doc as any).lastAutoTable.finalY + 8;
  if (opts.quote.discount > 0) doc.text(`Desconto: ${brl(opts.quote.discount)}`, 140, y);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${brl(opts.quote.total)}`, 140, y + 6);

  if (opts.quote.notes) {
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(opts.quote.notes, 180), 14, y + 20);
  }

  doc.setFont("helvetica", "italic"); doc.setTextColor(80);
  doc.text("Para aprovar este orçamento, responda este e-mail ou entre em contato pelo WhatsApp.", 14, 244);
  footer(doc, opts.company);
  doc.save(`Orcamento-${opts.quote.number}.pdf`);
}