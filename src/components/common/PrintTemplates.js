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
    notes: 'تنبيه: يرجى التحقق من أبعاد الميكرون قبل البدء.'
  }
};

export const PrintTemplates = {
  /**
   * Order Management Layout (إدارة)
   */
  orderManagement(order, formDetails, customSettings = {}) {
    return `
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>طلبية إدارة</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; direction: rtl; }
          </style>
        </head>
        <body>
          <h2>استمارة طلبية الإدارة قيد إعادة التصميم 🔧</h2>
          <p>سيتم تفعيل هذا النموذج قريباً بعد تحديث المتطلبات.</p>
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
    const printedBy = customSettings.printedBy || 'مجهول';
    const createdBy = order.created_by || 'مجهول';
    
    const formattedDate = new Date(order.order_date).toLocaleDateString('ar-EG');
    const jobTypes = Array.isArray(formDetails.job_types) 
      ? formDetails.job_types.join(' - ') 
      : (formDetails.job_types || '—');

    const isPrintActive = Array.isArray(formDetails.job_types)
      ? formDetails.job_types.includes('طباعة')
      : false;

    const formatVal = (val, suffix = '') => {
      if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null') {
        return '—';
      }
      return val + suffix;
    };

    const formatWidthVal = (val, suffix = '') => {
      if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null') {
        return '—';
      }
      const isDeviating = formDetails.production_width && parseFloat(val) !== parseFloat(formDetails.production_width);
      if (isDeviating) {
        return `<span style="color: red; font-weight: bold; text-decoration: underline;">${val}${suffix}</span>`;
      }
      return val + suffix;
    };

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
              margin-bottom: 15px;
            }
            .header-title {
              font-size: 18pt;
              font-weight: 900;
              text-align: right;
            }
            .header-logo {
              max-height: 70px;
              max-width: 150px;
              object-fit: contain;
            }
            
            .meta-table {
              width: 100%;
              border-collapse: collapse;
              border: ${s.lineWidthTable}px solid #000;
              margin-bottom: 15px;
            }
            .meta-col {
              width: 50%;
              padding: 6px 12px;
              vertical-align: top;
            }
            .meta-col:first-child {
              border-left: ${s.lineWidthTable}px solid #000;
            }
            .meta-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 6px;
              font-size: 11pt;
            }
            .meta-item:last-child {
              margin-bottom: 0;
            }
            .meta-label {
              font-weight: bold;
              text-align: right;
            }
            .meta-value {
              text-align: left;
            }
            
            .section-title {
              text-align: center;
              font-size: 12pt;
              font-weight: bold;
              margin-top: 15px;
              margin-bottom: 10px;
              padding: 6px 0;
              border-top: 3px double #000;
              border-bottom: 1px solid #000;
              background: none;
            }
            
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .data-table th, .data-table td {
              border: ${s.lineWidthTable}px solid #000;
              padding: 6px 8px;
              font-size: 10.5pt;
              vertical-align: middle;
            }
            .data-table th {
              background-color: #fafafa;
              font-weight: bold;
              width: 210px;
              text-align: right;
            }
            .data-table td {
              text-align: center;
              background-color: #fff;
            }
            
            .wrap-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              width: 100%;
            }
            .wrap-text {
              flex-grow: 1;
              text-align: center;
            }
            .wrap-img-box {
              border: 1px solid #ddd;
              border-radius: 4px;
              background: #fff;
              padding: 2px;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 55px;
              width: 55px;
            }
            .wrap-img {
              max-height: 50px;
              max-width: 50px;
              object-fit: contain;
            }
            
            .warning-box {
              border: ${s.lineWidthTable}px dashed #000;
              padding: 10px;
              margin-top: 15px;
              font-size: 11pt;
              font-weight: bold;
              text-align: center;
            }
            .footer-info-line {
              margin-top: 15px;
              text-align: center;
              font-size: 9pt;
              color: #444;
              border-top: 1px solid #ddd;
              padding-top: 6px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-title">
              ${o.title} - رقم #${order.id}
            </div>
            <div>
              <img src="/images/printingslogo.png" class="header-logo" alt="logo">
            </div>
          </div>
          
          <table class="meta-table">
            <tr>
              <td class="meta-col">
                <div class="meta-item">
                  <span class="meta-label">اسم العميل:</span>
                  <span class="meta-value">${order.customer_name}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">الفني المسؤول:</span>
                  <span class="meta-value">${formDetails.technician || '—'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">مساعد الفني:</span>
                  <span class="meta-value">${formDetails.assistant_technician || '—'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">المنظم:</span>
                  <span class="meta-value">${formDetails.organizer_name || '—'}</span>
                </div>
              </td>
              <td class="meta-col">
                <div class="meta-item">
                  <span class="meta-label">التاريخ:</span>
                  <span class="meta-value">${formattedDate}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">الشفت:</span>
                  <span class="meta-value">${formDetails.shift || '—'}</span>
                </div>
                <div class="meta-item" style="align-items: flex-start;">
                  <span class="meta-label">رقم الطلب<br>الأساسي:</span>
                  <span class="meta-value" style="font-size: 14pt; font-weight: bold; margin-top: 4px;">#${order.id}</span>
                </div>
                ${formDetails.fasoon ? `
                  <div class="meta-item" style="justify-content: center; margin-top: 8px;">
                    <span style="color: red; font-weight: bold; font-size: 13pt; border: 2px solid red; padding: 2px 8px; border-radius: 4px;">⚠️ فأسون</span>
                  </div>
                ` : ''}
              </td>
            </tr>
          </table>
          
          <div class="section-title">القياسات الهندسية وكمية المنتج</div>
          <table class="data-table">
            <tr>
              <th>القطاع</th>
              <td>${formDetails.sector || '—'}</td>
            </tr>
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
              <td><strong>kg ${formDetails.weight_kg || '0'}</strong></td>
            </tr>
            <tr>
              <th>قياسات الكيس المعتمدة</th>
              <td><span style="font-size: 12pt;"><strong>طول: ${formDetails.production_length || '0'} mm × عرض: ${formDetails.production_width || '0'} mm</strong></span></td>
            </tr>
            ${isPrintActive ? `
              <tr>
                <th>مصدر التصميم والكليشة</th>
                <td>التصميم: ${formDetails.design_source || '—'} | الكليشة: ${formDetails.clishe_source || '—'}</td>
              </tr>
            ` : ''}
          </table>
          
          <div class="section-title">مواصفات الفلم البلاستيكي والطباعة واللف</div>
          <table class="data-table">
            ${isPrintActive ? `
              <tr>
                <th>تفاصيل الطباعة</th>
                <td>
                  <table style="width: 100%; border-collapse: collapse; margin: 0; font-size: 10.5pt; background: transparent;">
                    <tr>
                      <td style="border: none; padding: 4px 0; text-align: right; width: 50%;"><strong>نوع الطباعة:</strong> ${formDetails.print_subtype || '—'}</td>
                      <td style="border: none; padding: 4px 0; text-align: right; width: 50%;"><strong>النمط (طباعة):</strong> ${formDetails.print_style || '—'}</td>
                    </tr>
                    <tr>
                      <td style="border: none; padding: 4px 0; text-align: right;"><strong>المواد:</strong> ${formDetails.material || '—'}</td>
                      <td style="border: none; padding: 4px 0; text-align: right;"><strong>السماكة (MIC):</strong> ${formDetails.mic_value || '0'} Mic</td>
                    </tr>
                    <tr>
                      <td style="border: none; padding: 4px 0; text-align: right;"><strong>كمية الطبع:</strong> ${formDetails.print_quantity || '—'} kg</td>
                      <td style="border: none; padding: 4px 0; text-align: right;"><strong>عدد ألوان الطباعة:</strong> ${formDetails.print_color_count || '0'} ألوان</td>
                    </tr>
                    <tr>
                      <td style="border: none; padding: 4px 0; text-align: right;" colspan="2"><strong>قياس المواد:</strong> ${formatWidthVal(formDetails.material_measure, ' mm')}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            ` : ''}
            <tr>
              <th>اللامنيشن والغراء الفني</th>
              <td>
                ${formDetails.lamination_needed ? `
                  الصمغ: ${formDetails.glue_type || '—'}
                  ${formDetails.lamination_mat1 ? `<br>• مادة 1: ${formDetails.lamination_mat1} (${formatWidthVal(formDetails.lamination_meas1, ' mm')}، ${formatVal(formDetails.lamination_mic1, ' Mic')})` : ''}
                  ${formDetails.lamination_mat2 ? `<br>• مادة 2: ${formDetails.lamination_mat2} (${formatWidthVal(formDetails.lamination_meas2, ' mm')}  ، ${formatVal(formDetails.lamination_mic2, ' Mic')})` : ''}
                  ${formDetails.lamination_mat3 ? `<br>• مادة 3: ${formDetails.lamination_mat3} (${formatWidthVal(formDetails.lamination_meas3, ' mm')}  ، ${formatVal(formDetails.lamination_mic3, ' Mic')})` : ''}
                ` : 'لا يوجد'}
              </td>
            </tr>
            <tr>
              <th>تقطيع نهائي</th>
              <td>${formDetails.job_types && (formDetails.job_types.includes('قطع') || formDetails.job_types.includes('تقطيع')) ? 'نعم' : 'لا'}</td>
            </tr>
            <tr>
              <th>تغليف نهائي</th>
              <td>${formDetails.job_types && formDetails.job_types.includes('تغليف') ? 'نعم' : 'لا'}</td>
            </tr>
            <tr>
              <th>مواصفات بكرة اللف النهائية</th>
              <td>
                <div class="wrap-container">
                  <div class="wrap-text">
                    شكل اللف: <strong>${formDetails.wrap_shape === 'a' ? 'عدل' : formDetails.wrap_shape === 'b' ? 'عكس' : (formDetails.wrap_shape || '—')}</strong> | قطر: ${formDetails.wrap_diameter || '0'} mm | وزن: ${formDetails.wrap_weight || '0'} kg
                  </div>
                  ${formDetails.wrap_shape === 'a' || formDetails.wrap_shape === 'b' ? `
                    <div class="wrap-img-box">
                      <img src="/images/wrap${formDetails.wrap_shape}.png" alt="wrap shape" class="wrap-img" />
                    </div>
                  ` : ''}
                </div>
              </td>
            </tr>
            <tr>
              <th>مكان التسليم</th>
              <td>${formDetails.delivery_location || ''}</td>
            </tr>
            <tr>
              <th>تفاصيل أخرى</th>
              <td>${formDetails.extra_details || '—'}</td>
            </tr>
          </table>

          <div class="warning-box">
            ${o.notes}
          </div>
          <div class="footer-info-line">
            أنشئ بواسطة: ${createdBy} | طبع بواسطة: ${printedBy}
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

    // Build the 4 columns x 15 rows = 60 cells matrix filled column-by-column
    // Column 1: indices 0-14, Column 2: 15-29, Column 3: 30-44, Column 4: 45-59
    // We render row-by-row:
    let tableRowsHtml = '';
    for (let r = 0; r < 15; r++) {
      tableRowsHtml += '<tr>';
      for (let c = 0; c < 4; c++) {
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
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: ${s.lineWidthFree}px solid #000;
              padding-bottom: 4px;
              margin-bottom: 8px;
            }
            .header-bar-text {
              text-align: right;
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
            .header-logo {
              max-height: 35px;
              max-width: 120px;
              object-fit: contain;
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
              bottom: 3px;
              left: 10px;
              font-size: 8pt;
              color: #888;
            }
          </style>
        </head>
        <body>
          <div class="a5-card">
            <div class="header-bar">
              <div class="header-bar-text">
                <h1>${s.factoryName}</h1>
                <p>${o.title} | التاريخ: ${formattedDate}</p>
              </div>
              <div>
                <img src="/images/printingslogo.png" class="header-logo" alt="logo">
              </div>
            </div>
            
            <div class="meta-grid">
              <div><strong>اسم التجهيز:</strong> ${readyOrder.name}</div>
              <div><strong>رقم الطلب:</strong> ${readyOrder.order_id ? `#${readyOrder.order_id}` : '—'}</div>
              <div><strong>عدد الرولات:</strong> ${rolls.length} رول</div>
            </div>
            
            <table class="grid-table">
              <thead>
                <tr>
                  <th>العمود 1 (kg)</th>
                  <th>العمود 2 (kg)</th>
                  <th>العمود 3 (kg)</th>
                  <th>العمود 4 (kg)</th>
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
                  الوزن الصافي: ${netWeight.toFixed(2)} kg
                </div>
              </div>
            </div>
            
            ${o.notes ? `<div style="font-size: 8.5pt; margin-top: 4px; text-align: center; font-style: italic; padding: 0 40px; word-break: break-word;">${o.notes}</div>` : ''}
            
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
