/**
 * HTML templates for printing documents.
 * All settings (fonts, margins, lines width, custom header titles, notes)
 * are dynamically applied from the Supabase print_settings table.
 */

// Safe fallback default settings
const defaultSettings = {
  general: {
    factoryName: 'شركة HHA للتجارة والتجهيز',
    phone: '07700000000',
    logoUrl: '',
    fontFamily: 'Tahoma',
    lineWidthFree: '1',
    lineWidthTable: '1'
  },
  prepCard: {
    title: 'بطاقة تجهيز رولات',
    notes: ''
  },
  mgmtOrder: {
    title: 'طلبية إدارة',
    notes: 'شكراً لتعاملكم معنا'
  },
  workOrder: {
    title: 'أمر تشغيل وإنتاج',
    notes: 'تنبيه للإنتاج والورشة: يرجى التحقق من أبعاد الميكرون قبل البدء.'
  }
};

export const PrintTemplates = {
  /**
   * Order Management Layout (إدارة)
   */
  orderManagement(order, formDetails, customSettings = {}) {
    const s = { ...defaultSettings.general, ...customSettings.general };
    const o = { ...defaultSettings.mgmtOrder, ...customSettings.mgmtOrder };
    
    const formattedDate = new Date(order.order_date).toLocaleDateString('ar-EG');
    const jobTypes = Array.isArray(formDetails.job_types) 
      ? formDetails.job_types.join(' - ') 
      : (formDetails.job_types || '—');

    return `
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${o.title} #${order.id}</title>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 0; }
              html, body { height: 100%; max-height: 100%; overflow: hidden; page-break-inside: avoid; }
            }
            * { box-sizing: border-box; }
            body {
              font-family: '${s.fontFamily}', Tahoma, sans-serif;
              color: #111;
              margin: 0;
              padding: 12mm;
              direction: rtl;
              background-color: #fff;
              line-height: 1.35;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: ${s.lineWidthFree}px solid #000;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .header-info h1 { margin: 0; font-size: 18pt; font-weight: bold; }
            .header-info h2 { margin: 3px 0 0 0; font-size: 12pt; font-weight: normal; color: #444; }
            .header-logo {
              max-height: 60px;
              max-width: 150px;
            }
            .header-logo-text {
              font-size: 16pt;
              font-weight: bold;
              border: ${s.lineWidthTable}px solid #000;
              padding: 4px 10px;
            }
            
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              margin-bottom: 12px;
              border: ${s.lineWidthTable}px solid #000;
              padding: 10px;
            }
            .meta-item {
              font-size: 10.5pt;
            }
            .meta-item strong {
              color: #000;
              display: inline-block;
              width: 120px;
            }
            
            .section-title {
              font-size: 11pt;
              font-weight: bold;
              border-bottom: ${s.lineWidthFree}px solid #000;
              padding-bottom: 2px;
              margin-top: 10px;
              margin-bottom: 6px;
            }
            
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            .data-table th, .data-table td {
              border: ${s.lineWidthTable}px solid #000;
              padding: 6px 8px;
              text-align: right;
              font-size: 10pt;
            }
            .data-table th {
              background-color: #f5f5f5;
              font-weight: bold;
              width: 200px;
            }
            
            .footer {
              position: absolute;
              bottom: 12mm;
              left: 12mm;
              right: 12mm;
              text-align: center;
              font-size: 9pt;
              border-top: ${s.lineWidthFree}px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-info">
              <h1>${s.factoryName}</h1>
              <h2>${o.title} (إدارة) - رقم #${order.id}</h2>
              <div style="font-size: 9pt; margin-top: 2px;">الهاتف: ${s.phone}</div>
            </div>
            <div>
              ${s.logoUrl ? `<img src="${s.logoUrl}" class="header-logo" alt="logo">` : `<span class="header-logo-text">HHA</span>`}
            </div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item"><strong>اسم العميل:</strong> ${order.customer_name}</div>
            <div class="meta-item"><strong>تاريخ الطلبية:</strong> ${formattedDate}</div>
            <div class="meta-item"><strong>رقم الهاتف:</strong> ${formDetails.customer_phone || '—'}</div>
            <div class="meta-item"><strong>اسم المنظم:</strong> ${formDetails.organizer_name || '—'}</div>
            <div class="meta-item"><strong>الفني المسؤول:</strong> ${formDetails.technician || '—'} / ${formDetails.assistant_technician || '—'}</div>
            <div class="meta-item"><strong>الشفت:</strong> ${formDetails.shift || '—'}</div>
          </div>
          
          <div class="section-title">المواصفات الفنية والإنتاج</div>
          <table class="data-table">
            <tr>
              <th>الوصف الوظيفي</th>
              <td>${formDetails.functional_desc || '—'}</td>
            </tr>
            <tr>
              <th>نوعية العمل</th>
              <td>${jobTypes}</td>
            </tr>
            <tr>
              <th>الكمية المطلوبة (kg)</th>
              <td>${formDetails.weight_kg || '0'} kg</td>
            </tr>
            <tr>
              <th>أبعاد المنتج (طول × عرض)</th>
              <td>${formDetails.production_length || '0'} mm × ${formDetails.production_width || '0'} mm</td>
            </tr>
            <tr>
              <th>الطباعة والفيلم</th>
              <td>
                المادة: ${formDetails.material || '—'} | 
                السماكة: ${formDetails.mic_value || '0'} Mic | 
                النوع: ${formDetails.print_style || '—'} (${formDetails.print_subtype || '—'}) | 
                ألوان: ${formDetails.print_color_count || '0'} ألوان
              </td>
            </tr>
            <tr>
              <th>كمية الطبع / قياس المواد</th>
              <td>كمية: ${formDetails.print_quantity || '0'} | قياس المواد: ${formDetails.material_measure || '0'} mm</td>
            </tr>
            <tr>
              <th>اللامنيشن والغراء</th>
              <td>
                الصمغ: ${formDetails.glue_type || '—'} |
                اللامنيشن: ${formDetails.lamination_needed ? 'نعم' : 'لا'}
                ${formDetails.lamination_mat1 ? `<br>• مادة 1: ${formDetails.lamination_mat1} (${formDetails.lamination_meas1} mm، ${formDetails.lamination_mic1} Mic)` : ''}
                ${formDetails.lamination_mat2 ? `<br>• مادة 2: ${formDetails.lamination_mat2} (${formDetails.lamination_meas2} mm， ${formDetails.lamination_mic2} Mic)` : ''}
              </td>
            </tr>
            <tr>
              <th>التقطيع والتغليف وشكل اللف</th>
              <td>
                تقطيع: ${formDetails.cutting_needed ? 'نعم' : 'لا'} | 
                تغليف: ${formDetails.packaging_needed ? 'نعم' : 'لا'} | 
                اللف: شكل ${formDetails.wrap_shape || '—'} (قطر ${formDetails.wrap_diameter || '0'} mm، وزن ${formDetails.wrap_weight || '0'} kg)
              </td>
            </tr>
            <tr>
              <th>مكان التسليم</th>
              <td>${formDetails.delivery_location || '—'}</td>
            </tr>
          </table>
          
          <div class="section-title">الحسابات والمالية</div>
          <table class="data-table">
            <tr>
              <th>طريقة وتفاصيل الدفع</th>
              <td>طريقة: ${formDetails.payment_method || '—'} | تفاصيل: ${formDetails.payment_details || '—'}</td>
            </tr>
            <tr>
              <th>المبلغ الكلي الإجمالي</th>
              <td><strong>${parseFloat(formDetails.total_amount || 0).toLocaleString('ar-IQ')} دينار عراقي</strong></td>
            </tr>
            <tr>
              <th>ملاحظات إضافية</th>
              <td>${order.details || '—'}</td>
            </tr>
          </table>
          
          <div class="footer">
            <p>${o.notes}</p>
            <div style="font-size: 8pt; color: #666; margin-top: 4px;">نظام HHA - مطبعة ${s.factoryName}</div>
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Order Work Layout (العمل)
   */
  orderWork(order, formDetails, customSettings = {}) {
    const s = { ...defaultSettings.general, ...customSettings.general };
    const o = { ...defaultSettings.workOrder, ...customSettings.workOrder };
    
    const formattedDate = new Date(order.order_date).toLocaleDateString('ar-EG');
    const jobTypes = Array.isArray(formDetails.job_types) 
      ? formDetails.job_types.join(' - ') 
      : (formDetails.job_types || '—');

    return `
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${o.title} #${order.id}</title>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 0; }
              html, body { height: 100%; max-height: 100%; overflow: hidden; page-break-inside: avoid; }
            }
            * { box-sizing: border-box; }
            body {
              font-family: '${s.fontFamily}', Tahoma, sans-serif;
              color: #000;
              margin: 0;
              padding: 12mm;
              direction: rtl;
              line-height: 1.35;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: ${s.lineWidthFree}px solid #000;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .header-info h1 { margin: 0; font-size: 18pt; font-weight: 900; }
            .header-info h2 { margin: 3px 0 0 0; font-size: 12pt; font-weight: bold; }
            
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              margin-bottom: 12px;
              border: ${s.lineWidthTable}px solid #000;
              padding: 8px;
            }
            .meta-item {
              font-size: 10.5pt;
            }
            .meta-item strong {
              display: inline-block;
              width: 120px;
            }
            
            .section-title {
              font-size: 11pt;
              font-weight: 900;
              background-color: #f0f0f0;
              border-bottom: ${s.lineWidthFree}px solid #000;
              padding: 4px 8px;
              margin-top: 12px;
              margin-bottom: 6px;
            }
            
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            .data-table th, .data-table td {
              border: ${s.lineWidthTable}px solid #000;
              padding: 6px 8px;
              text-align: right;
              font-size: 10.5pt;
            }
            .data-table th {
              background-color: #fafafa;
              font-weight: bold;
              width: 200px;
            }
            
            .warning-box {
              border: ${s.lineWidthTable}px dashed #000;
              padding: 10px;
              margin-top: 15px;
              font-size: 11pt;
              font-weight: bold;
            }
            
            .footer {
              position: absolute;
              bottom: 12mm;
              left: 12mm;
              right: 12mm;
              text-align: center;
              font-size: 9pt;
              border-top: ${s.lineWidthFree}px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-info">
              <h1>أمر تشغيل الورشة</h1>
              <h2>${o.title} - رقم #${order.id}</h2>
            </div>
            <div style="font-size: 10pt; font-weight: bold;">
              فني المسؤول: ${formDetails.technician || '—'}
            </div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item"><strong>اسم العميل:</strong> ${order.customer_name}</div>
            <div class="meta-item"><strong>التاريخ:</strong> ${formattedDate}</div>
            <div class="meta-item"><strong>مساعد الفني:</strong> ${formDetails.assistant_technician || '—'}</div>
            <div class="meta-item"><strong>الشفت:</strong> ${formDetails.shift || '—'}</div>
            <div class="meta-item"><strong>المنظم:</strong> ${formDetails.organizer_name || '—'}</div>
            <div class="meta-item"><strong>رقم الطلب الأساسي:</strong> #${order.id}</div>
          </div>
          
          <div class="section-title">القياسات الهندسية وكمية المنتج</div>
          <table class="data-table">
            <tr>
              <th>الوصف الوظيفي للمنتج</th>
              <td>${formDetails.functional_desc || '—'}</td>
            </tr>
            <tr>
              <th>نوعية العمل المطلوبة</th>
              <td><strong>${jobTypes}</strong></td>
            </tr>
            <tr>
              <th>الكمية المطلوبة للإنتاج (kg)</th>
              <td><strong>${formDetails.weight_kg || '0'} kg</strong></td>
            </tr>
            <tr>
              <th>قياسات الكيس المعتمدة</th>
              <td><span style="font-size: 12pt;"><strong>طول: ${formDetails.production_length || '0'} mm × عرض: ${formDetails.production_width || '0'} mm</strong></span></td>
            </tr>
            <tr>
              <th>مصدر التصميم والكليشة</th>
              <td>التصميم: ${formDetails.design_source || '—'} | الكليشة: ${formDetails.clishe_source || '—'}</td>
            </tr>
          </table>
          
          <div class="section-title">مواصفات الفلم البلاستيكي والطباعة واللف</div>
          <table class="data-table">
            <tr>
              <th>مادة الميكرون المحددة (Mic)</th>
              <td><strong>المادة: ${formDetails.material || '—'} | السماكة: ${formDetails.mic_value || '0'} Mic</strong></td>
            </tr>
            <tr>
              <th>ألوان الطباعة ونوعها</th>
              <td>النوع: ${formDetails.print_style || '—'} (${formDetails.print_subtype || '—'}) | <strong>عدد الألوان: ${formDetails.print_color_count || '0'} ألوان</strong></td>
            </tr>
            <tr>
              <th>كمية الطبع / قياس المواد</th>
              <td>الكمية: ${formDetails.print_quantity || '0'} | قياس المواد: ${formDetails.material_measure || '0'} mm</td>
            </tr>
            <tr>
              <th>اللامنيشن والغراء الفني</th>
              <td>
                الصمغ: ${formDetails.glue_type || '—'} |
                اللامنيشن: <strong>${formDetails.lamination_needed ? 'نعم - يحتاج' : 'لا يحتاج'}</strong>
                ${formDetails.lamination_mat1 ? `<br>• مادة 1: ${formDetails.lamination_mat1} (${formDetails.lamination_meas1} mm، ${formDetails.lamination_mic1} Mic)` : ''}
                ${formDetails.lamination_mat2 ? `<br>• مادة 2: ${formDetails.lamination_mat2} (${formDetails.lamination_meas2} mm، ${formDetails.lamination_mic2} Mic)` : ''}
              </td>
            </tr>
            <tr>
              <th>تقطيع وتغليف نهائي</th>
              <td>تقطيع: ${formDetails.cutting_needed ? 'نعم' : 'لا'} | تغليف: ${formDetails.packaging_needed ? 'نعم' : 'لا'}</td>
            </tr>
            <tr>
              <th>مواصفات بكرة اللف النهائية</th>
              <td>شكل اللف: <strong>${formDetails.wrap_shape || '—'}</strong> | قطر: ${formDetails.wrap_diameter || '0'} mm | وزن: ${formDetails.wrap_weight || '0'} kg</td>
            </tr>
            <tr>
              <th>تعليمات التسليم للورشة</th>
              <td>مكان التسليم: ${formDetails.delivery_location || '—'}</td>
            </tr>
          </table>

          <div class="warning-box">
            ${o.notes}
          </div>
          
          <div class="footer">
            <div style="font-size: 8pt; color: #666;">نظام إدارة التشغيل - مطبعة ${s.factoryName}</div>
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Preparation Card (بطاقة تجهيز - Horizontal A5 inside Vertical A4 sheet)
   */
  preparationCard(readyOrder, customSettings = {}) {
    const s = { ...defaultSettings.general, ...customSettings.general };
    const o = { ...defaultSettings.prepCard, ...customSettings.prepCard };
    
    const rolls = readyOrder.ready_order_rolls || [];
    const rollWeights = rolls.map(r => (parseFloat(r.weight) || 0) / 1000);
    
    // Calculate weights
    const grossWeight = rollWeights.reduce((sum, w) => sum + w, 0);
    const pipeWeight = (parseFloat(readyOrder.pipe_weight) || 0) / 1000;
    const netWeight = grossWeight - (rolls.length * pipeWeight);
    const formattedDate = new Date(readyOrder.created_at || new Date()).toLocaleDateString('ar-EG');

    // Build the 3 columns x 15 rows = 45 cells matrix filled column-by-column
    // Column 1: indices 0-14, Column 2: 15-29, Column 3: 30-44
    // We render row-by-row:
    let tableRowsHtml = '';
    for (let r = 0; r < 15; r++) {
      tableRowsHtml += '<tr>';
      for (let c = 0; c < 3; c++) {
        const index = r + (c * 15);
        const weightValue = rollWeights[index];
        // Pad remaining/empty cells with '-'
        const displayVal = (weightValue !== undefined && weightValue > 0) ? `${weightValue.toFixed(2)}` : '-';
        tableRowsHtml += `<td class="mono">${displayVal}</td>`;
      }
      tableRowsHtml += '</tr>';
    }

    return `
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${o.title} - ${readyOrder.name}</title>
          <style>
            @media print {
              @page {
                size: A4 portrait; /* Printed inside a vertical A4 sheet */
                margin: 0;
              }
              html, body { height: 100%; max-height: 100%; overflow: hidden; page-break-inside: avoid; }
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 0;
              background-color: #fff;
            }
            /* A5 Landscape box centered/aligned at the top half of the A4 page */
            .a5-card {
              width: 210mm;
              height: 148mm;
              padding: 10mm;
              border-bottom: ${s.lineWidthFree}px dashed #888; /* Horizontal cut here line */
              position: relative;
              box-sizing: border-box;
              font-family: '${s.fontFamily}', Tahoma, sans-serif;
              color: #000;
              line-height: 1.3;
            }
            .header-bar {
              text-align: center;
              border-bottom: ${s.lineWidthFree}px solid #000;
              padding-bottom: 4px;
              margin-bottom: 8px;
            }
            .header-bar h1 {
              margin: 0;
              font-size: 15pt;
              font-weight: bold;
            }
            .header-bar p {
              margin: 2px 0 0 0;
              font-size: 8.5pt;
              color: #444;
            }
            
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10px;
              margin-bottom: 8px;
              font-size: 9.5pt;
            }
            
            .grid-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 6px;
              /* Force LTR so Column 1 renders on the left despite RTL document */
              direction: ltr;
            }
            .grid-table th, .grid-table td {
              border: ${s.lineWidthTable}px solid #000;
              padding: 3px 5px;
              text-align: center;
              font-size: 8.5pt;
            }
            .grid-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .mono {
              font-family: 'Courier New', Courier, monospace;
              font-weight: bold;
            }
            
            .totals-box {
              border: ${s.lineWidthTable}px solid #000;
              padding: 6px;
              background-color: #fafafa;
              margin-top: 4px;
              direction: ltr;
            }
            .totals-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr;
              gap: 4px;
              font-size: 9pt;
              direction: ltr;
            }
            .totals-highlight {
              grid-column: span 4;
              border-top: ${s.lineWidthFree}px solid #000;
              margin-top: 4px;
              padding-top: 4px;
              font-size: 11pt;
              font-weight: bold;
              text-align: center;
            }
            .cut-label {
              position: absolute;
              bottom: 1px;
              left: 5px;
              font-size: 8pt;
              color: #888;
            }
          </style>
        </head>
        <body>
          <div class="a5-card">
            <div class="header-bar">
              <h1>${s.factoryName}</h1>
              <p>${o.title} | التاريخ: ${formattedDate}</p>
            </div>
            
            <div class="meta-grid">
              <div><strong>اسم التجهيز:</strong> ${readyOrder.name}</div>
              <div><strong>رقم الطلب المرتبط:</strong> ${readyOrder.order_id ? `#${readyOrder.order_id}` : '—'}</div>
              <div><strong>عدد الرولات:</strong> ${rolls.length} رول</div>
            </div>
            
            <table class="grid-table">
              <thead>
                <tr>
                  <th>أوزان العمود 1 (kg)</th>
                  <th>أوزان العمود 2 (kg)</th>
                  <th>أوزان العمود 3 (kg)</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
            
            <div class="totals-box">
              <div class="totals-grid">
                <div><strong>الوزن الكلي:</strong> ${grossWeight.toFixed(2)} kg</div>
                <div><strong>طول الماسورة:</strong> ${readyOrder.pipe_length || '0'} cm</div>
                <div><strong>وزن الماسورة:</strong> ${pipeWeight.toFixed(3)} kg</div>
                <div><strong>عدد الرولات:</strong> ${rolls.length} رول</div>
                <div class="totals-highlight">
                  الوزن الصافي الكلي: ${netWeight.toFixed(2)} kg
                </div>
              </div>
            </div>
            
            ${o.notes ? `<div style="font-size: 8.5pt; margin-top: 4px; text-align: center; font-style: italic;">${o.notes}</div>` : ''}
            
            <div class="cut-label">✂️</div>
          </div>
        </body>
      </html>
    `;
  },

  /**
   * General Report Layout
   */
  reportSummary(title, columns, rows, customSettings = {}) {
    const s = { ...defaultSettings.general, ...customSettings.general };
    const formattedDate = new Date().toLocaleDateString('ar-EG');

    let headersHtml = columns.map(c => `<th>${c}</th>`).join('');
    let rowsHtml = rows.map(row => {
      let cells = row.map(val => `<td>${val}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 0; }
              html, body { height: 100%; max-height: 100%; overflow: hidden; page-break-inside: avoid; }
            }
            * { box-sizing: border-box; }
            body {
              font-family: '${s.fontFamily}', Tahoma, sans-serif;
              color: #333;
              margin: 0;
              padding: 12mm;
              direction: rtl;
            }
            .header {
              text-align: center;
              border-bottom: ${s.lineWidthFree}px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header h1 { margin: 0 0 5px 0; font-size: 18pt; }
            .header h2 { margin: 0; font-size: 13pt; font-weight: normal; color: #555; }
            
            .report-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .report-table th, .report-table td {
              border: ${s.lineWidthTable}px solid #000;
              padding: 8px;
              text-align: center;
              font-size: 10.5pt;
            }
            .report-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            
            .meta {
              display: flex;
              justify-content: space-between;
              font-size: 9.5pt;
              color: #666;
              margin-bottom: 15px;
            }
            .footer {
              position: absolute;
              bottom: 12mm;
              left: 12mm;
              right: 12mm;
              text-align: center;
              font-size: 8.5pt;
              color: #888;
              border-top: ${s.lineWidthFree}px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${s.factoryName}</h1>
            <h2>${title}</h2>
          </div>
          
          <div class="meta">
            <span>تاريخ إصدار التقرير: ${formattedDate}</span>
            <span>الهاتف: ${s.phone}</span>
          </div>
          
          <table class="report-table">
            <thead>
              <tr>
                ${headersHtml}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          
          <div class="footer">
            <p>تقرير ملخص تم إنشاؤه آلياً بواسطة النظام</p>
          </div>
        </body>
      </html>
    `;
  }
};
