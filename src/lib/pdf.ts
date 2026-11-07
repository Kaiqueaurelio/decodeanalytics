import { customerTechnicalRows, readTechnicalData } from "./technical-order";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { brl, DEFAULT_COMPANY_DOCUMENT, fmtCnpj, fmtDate, fmtDateOnly } from "./format";

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
    production_status: string; urgent?: boolean; service_segment?: string; technical_data?: unknown;
  };
  client: { name: string; document?: string | null; whatsapp?: string | null; email?: string | null };
  items: Item[];
}) {
  const doc = new jsPDF();
  const logo = await loadLogo("/brand/decode-logo.png");
  header(doc, opts.company, `Ordem de Serviço #${opts.order.number}`, logo);

  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(50);
  doc.text(`CNPJ: ${fmtCnpj(opts.company.document || DEFAULT_COMPANY_DOCUMENT)}`, 14, 51);
  doc.text(`Emissão: ${fmtDate(opts.order.created_at)}`, 14, 58);
  doc.text(`Prazo de entrega: ${fmtDateOnly(opts.order.deadline)}`, 80, 58);
  if (opts.order.urgent) {
    doc.setTextColor(200, 30, 30); doc.setFont("helvetica", "bold");
    doc.text("URGENTE", 170, 58);
    doc.setTextColor(50); doc.setFont("helvetica", "normal");
  }

  doc.setFont("helvetica", "bold"); doc.text("Cliente", 14, 68);
  doc.setFont("helvetica", "normal");
  doc.text(opts.client.name, 14, 74);
  doc.text(
    [opts.client.document, opts.client.whatsapp, opts.client.email].filter(Boolean).join("  •  "),
    14, 80,
  );

  autoTable(doc, {
    startY: 88,
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

  if (opts.order.service_segment === "tecnologia") {
    doc.addPage();
    header(doc, opts.company, `Ficha técnica — OS #${opts.order.number}`, logo);
    autoTable(doc, {startY: 52, head: [["Entrada e atendimento", "Registro"]], body: customerTechnicalRows(readTechnicalData(opts.order.technical_data)), styles: {fontSize: 9, cellWidth: 'wrap'}, columnStyles: {0: {cellWidth: 58}, 1: {cellWidth: 124}}, margin: {top: 52, bottom: 30}, headStyles: {fillColor: [11,16,38], textColor: 255} });
  }
  for (let page=1; page<=doc.getNumberOfPages(); page++) {doc.setPage(page); footer(doc, opts.company);}
  doc.save(`OS-${opts.order.number}.pdf`);
}

export async function generateQuotePDF(opts: {
  company: Company;
  quote: { number: number; created_at: string; validity_date?: string | null; total: number; notes?: string | null; discount: number };
  client: { name: string; document?: string | null; whatsapp?: string | null; email?: string | null };
  items: Item[];
}) {
  const doc = new jsPDF();
  const logo = await loadLogo("/brand/decode-logo.png");
  header(doc, opts.company, `Orçamento #${opts.quote.number}`, logo);
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(50);
  doc.text(`CNPJ: ${fmtCnpj(opts.company.document || DEFAULT_COMPANY_DOCUMENT)}`, 14, 51);
  doc.text(`Data: ${fmtDate(opts.quote.created_at)}`, 14, 58);
  doc.text(`Validade: ${fmtDateOnly(opts.quote.validity_date)}`, 80, 58);

  doc.setFont("helvetica", "bold"); doc.text("Cliente", 14, 68);
  doc.setFont("helvetica", "normal");
  doc.text(opts.client.name, 14, 74);
  doc.text(
    [opts.client.document, opts.client.whatsapp, opts.client.email].filter(Boolean).join("  •  "),
    14, 80,
  );

  autoTable(doc, {
    startY: 88,
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

export async function generateClosureReceiptPDF(opts: {
  company: Company;
  closure: {
    closure_date: string;
    closed_at?: string | null;
    operator?: string | null;
    initial_amount: number;
    expected_cash: number;
    counted_cash: number;
    difference: number;
    total_in: number;
    total_out: number;
    by_method?: { cash?: number; pix?: number; debit?: number; credit?: number; other?: number };
    entries_count: number;
    notes?: string | null;
  };
  items?: any[];
}) {
  const doc = new jsPDF();
  const logo = await loadLogo("/brand/decode-logo.png");
  const c = opts.closure;
  const m = c.by_method || {};
  const ok = Math.abs(Number(c.difference || 0)) < 0.01;
  const dateFormatted = new Date(c.closure_date + "T12:00:00").toLocaleDateString("pt-BR");
  const closedAtFormatted = c.closed_at
    ? new Date(c.closed_at).toLocaleString("pt-BR")
    : new Date().toLocaleString("pt-BR");

  header(doc, opts.company, `Fechamento de Caixa - ${dateFormatted}`, logo);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50);
  doc.text(`CNPJ: ${fmtCnpj(opts.company.document || DEFAULT_COMPANY_DOCUMENT)}`, 14, 51);
  doc.text(`Data do Caixa: ${dateFormatted}`, 14, 57);
  doc.text(`Fechado em: ${closedAtFormatted}`, 75, 57);
  doc.text(`Operador: ${c.operator || "—"}`, 145, 57);

  // Status badge
  doc.setFont("helvetica", "bold");
  if (ok) {
    doc.setTextColor(5, 150, 105);
    doc.text("SITUAÇÃO: CAIXA BATE (SEM DIFERENÇAS)", 14, 65);
  } else {
    doc.setTextColor(180, 83, 9);
    doc.text(`SITUAÇÃO: COM DIFERENÇA DE ${brl(c.difference)}`, 14, 65);
  }

  // Summary Table
  const balance = Number(c.total_in || 0) - Number(c.total_out || 0);
  autoTable(doc, {
    startY: 70,
    head: [["Resumo Financeiro", "Valor"]],
    body: [
      ["Troco Inicial (Fundo de Caixa)", brl(c.initial_amount)],
      ["Total de Entradas", brl(c.total_in)],
      ["Total de Saídas / Despesas", brl(c.total_out)],
      ["Saldo Líquido do Dia", brl(balance)],
      ["Quantidade de Lançamentos", String(c.entries_count || 0)],
    ],
    headStyles: { fillColor: [34, 38, 70], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: "right" } },
  });

  // Payment methods Table
  const paymentRows: string[][] = [
    ["Dinheiro", brl(m.cash || 0)],
    ["PIX", brl(m.pix || 0)],
    ["Cartão de Débito", brl(m.debit || 0)],
    ["Cartão de Crédito", brl(m.credit || 0)],
  ];
  if (m.other) {
    paymentRows.push(["Outros / Mistos", brl(m.other)]);
  }

  const yAfterSummary = (doc as any).lastAutoTable.finalY + 6;
  autoTable(doc, {
    startY: yAfterSummary,
    head: [["Entradas por Forma de Pagamento", "Total"]],
    body: paymentRows,
    headStyles: { fillColor: [45, 55, 72], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: "right" } },
  });

  // Physical cash reconciliation table
  const yAfterPayments = (doc as any).lastAutoTable.finalY + 6;
  autoTable(doc, {
    startY: yAfterPayments,
    head: [["Conferência do Dinheiro em Espécie (Gaveta)", "Valor"]],
    body: [
      ["Esperado em Dinheiro (Entradas + Troco Inicial)", brl(c.expected_cash)],
      ["Contado na Gaveta", brl(c.counted_cash)],
      ["Diferença de Caixa", brl(c.difference)],
    ],
    headStyles: { fillColor: [34, 38, 70], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: "right" } },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 6;

  if (c.notes) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 38, 70);
    doc.setFontSize(9);
    doc.text("Observações:", 14, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(70);
    const splitNotes = doc.splitTextToSize(String(c.notes), 180);
    doc.text(splitNotes, 14, currentY + 5);
    currentY += 8 + splitNotes.length * 4;
  }

  // Items table if present
  if (opts.items && opts.items.length > 0) {
    const itemRows = opts.items.map((it) => {
      const time = new Date(it.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const sign = it.type === "saida" ? "-" : "+";
      const desc = it.description || it.category || "Lançamento";
      const pm = it.payment_method ? ` (${it.payment_method})` : "";
      return [time, `${desc}${pm}`, `${sign}${brl(it.amount)}`];
    });

    autoTable(doc, {
      startY: currentY,
      head: [["Hora", "Lançamento / Método", "Valor"]],
      body: itemRows,
      headStyles: { fillColor: [34, 38, 70], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 115 }, 2: { cellWidth: 40, halign: "right" } },
      margin: { bottom: 26 },
    });
  }

  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    footer(doc, opts.company);
  }

  const safeDate = c.closure_date.replace(/[^0-9-]/g, "");
  doc.save(`Fechamento-Caixa-${safeDate}.pdf`);
}
