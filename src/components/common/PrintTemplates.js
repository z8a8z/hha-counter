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

    const getWidthCell = (val, suffix = ' mm') => {
      if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null') {
        return '<td>—</td>';
      }
      const isDeviating = formDetails.production_width && parseFloat(val) !== parseFloat(formDetails.production_width);
      if (isDeviating) {
        return `<td class="highlight-warning">${val}${suffix}</td>`;
      }
      return `<td>${val}${suffix}</td>`;
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
              padding: 8mm 10mm;
              direction: rtl;
              line-height: 1.35;
              font-size: 10pt;
            }
            
            /* Header */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #000;
              padding-bottom: 6px;
              margin-bottom: 10px;
            }
            .header-title {
              font-size: 16pt;
              font-weight: 900;
              text-align: right;
            }
            .header-logo {
              max-height: 55px;
              max-width: 120px;
              object-fit: contain;
            }
            
            /* Card/Section Layout */
            .section-card {
              border: 1px solid #000;
              border-radius: 4px;
              margin-bottom: 8px;
              overflow: hidden;
            }
            .section-card-header {
              background: #f1f5f9;
              padding: 4px 10px;
              font-weight: bold;
              font-size: 10.5pt;
              border-bottom: 1px solid #000;
              text-align: right;
            }
            .section-card-body {
              padding: 6px 10px;
            }
            
            /* Meta / General Grid */
            .grid-3 {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            .meta-item {
              display: flex;
              align-items: baseline;
              font-size: 9.5pt;
              margin-bottom: 4px;
            }
            .meta-label {
              font-weight: bold;
              min-width: 85px;
              color: #333;
            }
            .meta-value {
              flex-grow: 1;
              font-weight: 500;
            }
            
            /* Tables */
            .table-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
            }
            .table-grid th, .table-grid td {
              border: 1px solid #000;
              padding: 5px 8px;
              font-size: 9.5pt;
              text-align: center;
              vertical-align: middle;
            }
            .table-grid th {
              background-color: #f8fafc;
              font-weight: bold;
              color: #1e293b;
            }
            
            /* Warning / Highlight Deviations */
            .highlight-warning {
              background-color: #ef4444 !important;
              color: #ffffff !important;
              font-weight: bold;
              text-decoration: underline;
            }
            
            /* Wrap specifics */
            .wrap-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 15px;
            }
            .wrap-info {
              flex-grow: 1;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
            }
            .wrap-img-box {
              border: 1px solid #000;
              border-radius: 4px;
              background: #fff;
              padding: 2px;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 48px;
              width: 48px;
            }
            .wrap-img {
              max-height: 44px;
              max-width: 44px;
              object-fit: contain;
            }
            
            .warning-box {
              border: 1.5px dashed #000;
              padding: 8px;
              margin-top: 10px;
              font-size: 10pt;
              font-weight: bold;
              text-align: center;
              background: #fef2f2;
            }
            .footer-info-line {
              margin-top: 10px;
              text-align: center;
              font-size: 8.5pt;
              color: #444;
              border-top: 1px solid #ccc;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <div class="header-title">${o.title}</div>
            <img class="header-logo" src="/images/printingslogo.png" alt="Logo" />
          </div>

          <!-- Section 1: Basic Info -->
          <div class="section-card">
            <div class="section-card-header">معلومات الطلب العامة</div>
            <div class="section-card-body grid-3">
              <div>
                <div class="meta-item"><span class="meta-label">اسم العميل:</span><span class="meta-value">${formDetails.customer_name || order.customer_name || '—'}</span></div>
                <div class="meta-item"><span class="meta-label">رقم العميل:</span><span class="meta-value">${formDetails.customer_phone || '—'}</span></div>
                <div class="meta-item"><span class="meta-label">القطاع:</span><span class="meta-value">${formDetails.sector || '—'}</span></div>
              </div>
              <div>
                <div class="meta-item"><span class="meta-label">الفني المسؤول:</span><span class="meta-value">${formDetails.technician || '—'}</span></div>
                <div class="meta-item"><span class="meta-label">مساعد الفني:</span><span class="meta-value">${formDetails.assistant_technician || '—'}</span></div>
                <div class="meta-item"><span class="meta-label">اسم المنظم:</span><span class="meta-value">${formDetails.organizer_name || '—'}</span></div>
              </div>
              <div>
                <div class="meta-item"><span class="meta-label">رقم الطلب:</span><span class="meta-value" style="font-weight: bold; font-size: 11pt;">#${order.id}</span></div>
                <div class="meta-item"><span class="meta-label">تاريخ الطلب:</span><span class="meta-value">${formattedDate}</span></div>
                <div class="meta-item">
                  <span class="meta-label">الشفت:</span>
                  <span class="meta-value">${formDetails.shift || '—'}</span>
                  ${formDetails.fasoon ? '<span style="color: red; font-weight: bold; margin-right: 15px; border: 1.5px solid red; padding: 0 4px; border-radius: 3px; font-size: 8.5pt;">⚠️ فأسون</span>' : ''}
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Production Characteristics -->
          <div class="section-card">
            <div class="section-card-header">مواصفات العمل والإنتاج</div>
            <div class="section-card-body">
              <table class="table-grid" style="margin-bottom: 0;">
                <tr>
                  <th style="width: 18%; text-align: right;">نوعية العمل</th>
                  <td style="width: 32%; text-align: right;"><strong>${jobTypes}</strong></td>
                  <th style="width: 18%; text-align: right;">الوصف الوظيفي</th>
                  <td style="width: 32%; text-align: right;">${formDetails.functional_desc || '—'}</td>
                </tr>
                <tr>
                  <th style="text-align: right;">الكمية المطلوبة</th>
                  <td style="text-align: right;"><strong>kg ${formDetails.weight_kg || '0'}</strong></td>
                  <th style="text-align: right;">كليشة / تصميم</th>
                  <td style="text-align: right;">
                    ${isPrintActive ? `التصميم: ${formDetails.design_source || '—'} | الكليشة: ${formDetails.clishe_source || '—'}` : '—'}
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Section 3: Measurements Comparison Table -->
          <div class="section-card">
            <div class="section-card-header">جدول قياسات وأبعاد المواد (أبعاد العرض والطول)</div>
            <div class="section-card-body">
              <table class="table-grid" style="margin-bottom: 0;">
                <thead>
                  <tr>
                    <th>قياس عرض المنتج المطلوب</th>
                    <th>قياس فلم الطباعة</th>
                    <th>قياس اللامنيشن 1</th>
                    <th>قياس اللامنيشن 2</th>
                    <th>قياس اللامنيشن 3</th>
                    <th>طول المنتج المطلوب</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>${formDetails.production_width || '0'} mm</strong></td>
                    ${getWidthCell(isPrintActive ? formDetails.material_measure : null)}
                    ${getWidthCell(formDetails.lamination_needed ? formDetails.lamination_meas1 : null)}
                    ${getWidthCell(formDetails.lamination_needed ? formDetails.lamination_meas2 : null)}
                    ${getWidthCell(formDetails.lamination_needed ? formDetails.lamination_meas3 : null)}
                    <td><strong>${formDetails.production_length || '0'} mm</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Section 4: Print & Lamination Details -->
          ${(isPrintActive || formDetails.lamination_needed) ? `
            <div class="section-card">
              <div class="section-card-header">تفاصيل خطوط الإنتاج (الطباعة واللامنيشن)</div>
              <div class="section-card-body grid-2" style="align-items: start;">
                
                <!-- Printing Column -->
                ${isPrintActive ? `
                  <div style="border-left: 1px solid #ccc; padding-left: 10px; width: 100%;">
                    <h5 style="margin: 0 0 6px; font-size: 10pt; color: var(--clr-accent-light); border-bottom: 1.5px solid #ccc; padding-bottom: 2px; text-align: right;">مواصفات الطباعة</h5>
                    <table class="table-grid" style="text-align: right; margin-bottom: 0;">
                      <tr>
                        <th style="text-align: right; width: 45%;">نوع الطباعة</th>
                        <td>${formDetails.print_subtype || '—'}</td>
                      </tr>
                      <tr>
                        <th style="text-align: right;">النمط (طباعة)</th>
                        <td>${formDetails.print_style || '—'}</td>
                      </tr>
                      <tr>
                        <th style="text-align: right;">المادة الميكرون</th>
                        <td>${formDetails.material || '—'} (${formDetails.mic_value || '0'} Mic)</td>
                      </tr>
                      <tr>
                        <th style="text-align: right;">عدد الألوان</th>
                        <td>${formDetails.print_color_count || '0'} ألوان</td>
                      </tr>
                      <tr>
                        <th style="text-align: right;">كمية الطبع</th>
                        <td>${formDetails.print_quantity || '0'} kg</td>
                      </tr>
                    </table>
                  </div>
                ` : '<div></div>'}
                
                <!-- Lamination Column -->
                ${formDetails.lamination_needed ? `
                  <div style="padding-right: 5px; width: 100%;">
                    <h5 style="margin: 0 0 6px; font-size: 10pt; color: var(--clr-accent-light); border-bottom: 1.5px solid #ccc; padding-bottom: 2px; text-align: right;">مواصفات اللامنيشن</h5>
                    <table class="table-grid" style="text-align: right; margin-bottom: 0;">
                      <tr>
                        <th style="text-align: right; width: 45%;">الصمغ المستخدم</th>
                        <td>${formDetails.glue_type || '—'}</td>
                      </tr>
                      <tr>
                        <th style="text-align: right;">الطبقة الأولى</th>
                        <td>${formDetails.lamination_mat1 || '—'} (${formDetails.lamination_mic1 || '0'} Mic)</td>
                      </tr>
                      <tr>
                        <th style="text-align: right;">الطبقة الثانية</th>
                        <td>${formDetails.lamination_mat2 || '—'} ${formDetails.lamination_mic2 ? `(${formDetails.lamination_mic2} Mic)` : ''}</td>
                      </tr>
                      <tr>
                        <th style="text-align: right;">الطبقة الثالثة</th>
                        <td>${formDetails.lamination_mat3 || '—'} ${formDetails.lamination_mic3 ? `(${formDetails.lamination_mic3} Mic)` : ''}</td>
                      </tr>
                    </table>
                  </div>
                ` : '<div></div>'}
                
              </div>
            </div>
          ` : ''}

          <!-- Section 5: Packaging & Roll Wrapping -->
          <div class="section-card">
            <div class="section-card-header">مواصفات التعبئة واللف النهائي</div>
            <div class="section-card-body grid-2" style="align-items: center;">
              <div>
                <table class="table-grid" style="text-align: right; margin-bottom: 0;">
                  <tr>
                    <th style="text-align: right; width: 45%;">تقطيع نهائي</th>
                    <td>${formDetails.job_types && (formDetails.job_types.includes('قطع') || formDetails.job_types.includes('تقطيع')) ? 'نعم' : 'لا'}</td>
                  </tr>
                  <tr>
                    <th style="text-align: right;">تغليف نهائي</th>
                    <td>${formDetails.job_types && formDetails.job_types.includes('تغليف') ? 'نعم' : 'لا'}</td>
                  </tr>
                  <tr>
                    <th style="text-align: right;">مكان التسليم</th>
                    <td>${formDetails.delivery_location || '—'}</td>
                  </tr>
                </table>
              </div>
              
              <div class="wrap-container">
                <div class="wrap-info">
                  <div style="font-size: 9pt; line-height: 1.4; text-align: right;">
                    <strong>شكل اللف:</strong><br>
                    ${formDetails.wrap_shape === 'a' ? 'عدل (a)' : formDetails.wrap_shape === 'b' ? 'عكس (b)' : (formDetails.wrap_shape || '—')}
                  </div>
                  <div style="font-size: 9pt; line-height: 1.4; text-align: right;">
                    <strong>قطر البكرة:</strong><br>
                    ${formDetails.wrap_diameter || '0'} mm
                  </div>
                  <div style="font-size: 9pt; line-height: 1.4; text-align: right;">
                    <strong>الوزن المحدد:</strong><br>
                    ${formDetails.wrap_weight || '0'} kg
                  </div>
                </div>
                ${formDetails.wrap_shape === 'a' || formDetails.wrap_shape === 'b' ? `
                  <div class="wrap-img-box">
                    <img src="/images/wrap${formDetails.wrap_shape}.png" alt="wrap shape" class="wrap-img" />
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Section 6: Extra Notes & Warnings -->
          ${formDetails.extra_details ? `
            <div class="section-card">
              <div class="section-card-header">ملاحظات الطلبية الخاصة</div>
              <div class="section-card-body" style="font-size: 9.5pt; white-space: pre-wrap; line-height: 1.4; text-align: right;">${formDetails.extra_details}</div>
            </div>
          ` : ''}

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
