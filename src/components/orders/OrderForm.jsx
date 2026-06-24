import React, { useState, useEffect } from 'react';

// Helper component for rectangle toggle items
function RectToggle({ label, selected, onToggle }) {
  return (
    <div
      className={`rect-toggle ${selected ? 'selected' : ''}`}
      onClick={() => onToggle(label)}
    >
      {label}
    </div>
  );
}

export default function OrderForm({ onCancel, onSuccess }) {
  // General section
  const [technician, setTechnician] = useState('');
  const [assistant, setAssistant] = useState('');
  const [shift, setShift] = useState('صباحي');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [sector, setSector] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [fasoon, setFasoon] = useState(false);
  const workTypesList = ['طباعة', 'لامنيشن', 'تقطيع', 'قطع']; // example options
  const [workTypes, setWorkTypes] = useState([]);

  // Production section
  const [prodLength, setProdLength] = useState('');
  const [prodWidth, setProdWidth] = useState('');
  const [designSource, setDesignSource] = useState('نحن نصمم');
  const [clisheSource, setClisheSource] = useState('نحن نكتب');
  const [printStyle, setPrintStyle] = useState('شفاف');

  // Printing section
  const [printSubtype, setPrintSubtype] = useState('سفلية');
  const [material, setMaterial] = useState('bopp shiny شفاف');
  const [mic, setMic] = useState('');
  const [printQty, setPrintQty] = useState('');
  const [colorCount, setColorCount] = useState('');
  const [materialMeasure, setMaterialMeasure] = useState('');

  // Lamination section
  const [laminationNeeded, setLaminationNeeded] = useState(false);
  const [lamMat1, setLamMat1] = useState('');
  const [lamMeas1, setLamMeas1] = useState('');
  const [lamMic1, setLamMic1] = useState('');
  const [lamMat2, setLamMat2] = useState('');
  const [lamMeas2, setLamMeas2] = useState('');
  const [lamMic2, setLamMic2] = useState('');
  const [lamMat3, setLamMat3] = useState('');
  const [lamMeas3, setLamMeas3] = useState('');
  const [lamMic3, setLamMic3] = useState('');

  // Finishing section
  const [glue, setGlue] = useState('صمغ تركي');
  const [cutNeeded, setCutNeeded] = useState(false);
  const [packNeeded, setPackNeeded] = useState(false);
  const [wrapShape, setWrapShape] = useState('a');
  const [wrapDiameter, setWrapDiameter] = useState('');
  const [wrapWeight, setWrapWeight] = useState('');
  const [deliveryPlace, setDeliveryPlace] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('نقد');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [extraDetails, setExtraDetails] = useState('');

  // Error handling (Arabic only)
  const [errorMsg, setErrorMsg] = useState('');

  // Helper for toggling work type rectangles
  const toggleWorkType = (type) => {
    setWorkTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation: required fields
    const requiredFields = [
      technician, assistant, shift, orderDate, customerName, customerPhone,
      organizerName, jobDesc, quantityKg, printSubtype, material, mic, printQty,
      colorCount, materialMeasure, glue, deliveryPlace, paymentMethod,
      paymentDetails, totalAmount
    ];
    if (requiredFields.some(f => f === '' || f === null)) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    // Additional numeric validation (positive numbers)
    const numericFields = [
      { label: 'كمية', value: quantityKg },
      { label: 'MIC', value: mic },
      { label: 'كمية الطبع', value: printQty },
      { label: 'عدد ألوان الطباعة', value: colorCount },
      { label: 'قياس المواد', value: materialMeasure },
      { label: 'قطر اللف', value: wrapDiameter },
      { label: 'وزن اللف', value: wrapWeight }
    ];
    const invalidNumeric = numericFields.find(f => f.value && (isNaN(parseFloat(f.value)) || parseFloat(f.value) <= 0));
    if (invalidNumeric) {
      setErrorMsg(`يرجى إدخال قيمة صحيحة وإيجابية لـ ${invalidNumeric.label}`);
      return;
    }
    // Ensure at least one work type selected
    if (workTypes.length === 0) {
      setErrorMsg('يرجى اختيار نوعية العمل على الأقل');
      return;
    }
    // Build payload for order_forms table
    const payload = {
      technician,
      assistant_technician: assistant,
      shift,
      // Base order fields for parent component
      customer_name: customerName,
      order_date: orderDate,
      extra_details: extraDetails,
      // Detailed order form fields
      customer_phone: customerPhone,
      organizer_name: organizerName,
      functional_desc: jobDesc,
      weight_kg: Number(quantityKg),
      fasoon: fasoon,
      job_types: workTypes,
      production_length: Number(prodLength),
      production_width: Number(prodWidth),
      design_source: designSource,
      clishe_source: clisheSource,
      print_style: printStyle,
      print_subtype: printSubtype,
      material,
      mic_value: Number(mic),
      print_quantity: Number(printQty),
      print_color_count: Number(colorCount),
      material_measure: Number(materialMeasure),
      lamination_needed: laminationNeeded,
      lamination_mat1: lamMat1 || null,
      lamination_meas1: lamMeas1 ? Number(lamMeas1) : null,
      lamination_mic1: lamMic1 ? Number(lamMic1) : null,
      lamination_mat2: lamMat2 || null,
      lamination_meas2: lamMeas2 ? Number(lamMeas2) : null,
      lamination_mic2: lamMic2 ? Number(lamMic2) : null,
      lamination_mat3: lamMat3 || null,
      lamination_meas3: lamMeas3 ? Number(lamMeas3) : null,
      lamination_mic3: lamMic3 ? Number(lamMic3) : null,
      glue_type: glue,
      cutting_needed: cutNeeded,
      packaging_needed: packNeeded,
      wrap_shape: wrapShape,
      wrap_diameter: Number(wrapDiameter),
      wrap_weight: Number(wrapWeight),
      delivery_location: deliveryPlace,
      payment_method: paymentMethod,
      payment_details: paymentDetails,
      total_amount: Number(totalAmount),
    };
    // Pass payload to parent via onSuccess (parent will create base order then full order)
    onSuccess(payload);
  };

  return (
    <div className="form-overlay" onClick={onCancel}>
      <form className="form-modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="form-modal-header">
          <h3>استمارة الطلبيات</h3>
          {errorMsg && <div className="error-banner">{errorMsg}</div>}
        </div>

        <div className="form-modal-body">
          {/* ---------- General ---------- */}
          <section className="form-card-section">
            <h4>عام</h4>
            <div className="form-grid-4">
              <div className="form-group">
                <label>الفني</label>
                <input type="text" value={technician} onChange={e => setTechnician(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>مساعد الفني</label>
                <input type="text" value={assistant} onChange={e => setAssistant(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>الشفت</label>
                <select value={shift} onChange={e => setShift(e.target.value)}>
                  <option value="صباحي">صباحي</option>
                  <option value="مسائي">مسائي</option>
                </select>
              </div>
              <div className="form-group">
                <label>التاريخ</label>
                <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} required />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>اسم العميل</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>رقم العميل</label>
                <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>اسم المنظم</label>
                <input type="text" value={organizerName} onChange={e => setOrganizerName(e.target.value)} required />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>القطاع</label>
                <input type="text" value={sector} onChange={e => setSector(e.target.value)} />
              </div>
              <div className="form-group">
                <label>كمية [كغم]</label>
                <input type="number" min="0" value={quantityKg} onChange={e => setQuantityKg(e.target.value)} required />
              </div>
              <div className="form-group" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', height: '100%' }}>
                <label className="form-checkbox-label">
                  <input type="checkbox" checked={fasoon} onChange={e => setFasoon(e.target.checked)} />
                  <span>فأسون (نعم)</span>
                </label>
              </div>
            </div>

            <div className="form-group span-full">
              <label>وصف وظيفي</label>
              <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={2} required />
            </div>

            <div className="form-group span-full">
              <label>نوعية العمل</label>
              <div className="rect-toggle-group">
                {workTypesList.map(item => (
                  <RectToggle
                    key={item}
                    label={item}
                    selected={workTypes.includes(item)}
                    onToggle={toggleWorkType}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ---------- Production ---------- */}
          <section className="form-card-section">
            <h4>الإنتاج</h4>
            <div className="form-grid-3">
              <div className="form-group">
                <label>قياس الانتاج (طول mm)</label>
                <input type="number" min="0" value={prodLength} onChange={e => setProdLength(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>قياس الانتاج (عرض mm)</label>
                <input type="number" min="0" value={prodWidth} onChange={e => setProdWidth(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>تصميم</label>
                <select value={designSource} onChange={e => setDesignSource(e.target.value)}>
                  <option value="نحن نصمم">نحن نصمم</option>
                  <option value="جاهز من الزبون">جاهز من الزبون</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>كليشة</label>
                <select value={clisheSource} onChange={e => setClisheSource(e.target.value)}>
                  <option value="نحن نكتب">نحن نكتب</option>
                  <option value="جاهز من الزبون">جاهز من الزبون</option>
                </select>
              </div>
              <div className="form-group">
                <label>طباعة</label>
                <select value={printStyle} onChange={e => setPrintStyle(e.target.value)}>
                  <option value="شفاف">شفاف</option>
                  <option value="مات">مات</option>
                  <option value="جزئي">جزئي</option>
                </select>
              </div>
            </div>
          </section>

          {/* ---------- Printing ---------- */}
          <section className="form-card-section">
            <h4>الطباعة</h4>
            <div className="form-grid-3">
              <div className="form-group">
                <label>نوع الطباعة</label>
                <select value={printSubtype} onChange={e => setPrintSubtype(e.target.value)}>
                  <option value="سفلية">سفلية</option>
                  <option value="سطحية">سطحية</option>
                </select>
              </div>
              <div className="form-group">
                <label>مواد</label>
                <select value={material} onChange={e => setMaterial(e.target.value)}>
                  <option value="bopp shiny شفاف">bopp shiny شفاف</option>
                  <option value="bopp matt طافي">bopp matt طافي</option>
                  <option value="cpp">cpp</option>
                  <option value="ldp">ldp</option>
                  <option value="shrink">shrink</option>
                  <option value="pet شفاف">pet شفاف</option>
                  <option value="pet matt طافي">pet matt طافي</option>
                </select>
              </div>
              <div className="form-group">
                <label>MIC (mm)</label>
                <input type="number" min="0" value={mic} onChange={e => setMic(e.target.value)} required />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>كمية الطبع</label>
                <input type="number" min="0" value={printQty} onChange={e => setPrintQty(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>عدد ألوان الطباعة (1‑10)</label>
                <input type="number" min="1" max="10" value={colorCount} onChange={e => setColorCount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>قياس المواد (mm)</label>
                <input type="number" min="0" value={materialMeasure} onChange={e => setMaterialMeasure(e.target.value)} required />
              </div>
            </div>
          </section>

          {/* ---------- Lamination ---------- */}
          <section className="form-card-section">
            <h4>لامنيشن</h4>
            <div className="form-group">
              <label className="form-checkbox-label">
                <input type="checkbox" checked={laminationNeeded} onChange={e => setLaminationNeeded(e.target.checked)} />
                <span>تحتاج لامنيشن</span>
              </label>
            </div>
            
            {laminationNeeded && (
              <div className="lamination-fields" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label>المادة الأولى</label>
                    <select value={lamMat1} onChange={e => setLamMat1(e.target.value)}>
                      <option value="">اختر مادة</option>
                      <option value="ldp">ldp</option>
                      <option value="bopp metaliza">bopp metaliza</option>
                      <option value="cpp">cpp</option>
                      <option value="pet metaliza">pet metaliza</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>قياس 1 (mm)</label>
                    <input type="number" min="0" value={lamMeas1} onChange={e => setLamMeas1(e.target.value)} disabled={!lamMat1} />
                  </div>
                  <div className="form-group">
                    <label>MIC 1 (mm)</label>
                    <input type="number" min="0" value={lamMic1} onChange={e => setLamMic1(e.target.value)} disabled={!lamMat1} />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label>المادة الثانية (اختياري)</label>
                    <select value={lamMat2} onChange={e => {
                      setLamMat2(e.target.value);
                      if (!e.target.value) {
                        setLamMeas2('');
                        setLamMic2('');
                      }
                    }}>
                      <option value="">لا شيء</option>
                      <option value="ldp">ldp</option>
                      <option value="bopp metaliza">bopp metaliza</option>
                      <option value="cpp">cpp</option>
                      <option value="pet metaliza">pet metaliza</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>قياس 2 (mm)</label>
                    <input type="number" min="0" value={lamMeas2} onChange={e => setLamMeas2(e.target.value)} disabled={!lamMat2} />
                  </div>
                  <div className="form-group">
                    <label>MIC 2 (mm)</label>
                    <input type="number" min="0" value={lamMic2} onChange={e => setLamMic2(e.target.value)} disabled={!lamMat2} />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label>المادة الثالثة (اختياري)</label>
                    <select value={lamMat3} onChange={e => {
                      setLamMat3(e.target.value);
                      if (!e.target.value) {
                        setLamMeas3('');
                        setLamMic3('');
                      }
                    }}>
                      <option value="">لا شيء</option>
                      <option value="ldp">ldp</option>
                      <option value="bopp metaliza">bopp metaliza</option>
                      <option value="cpp">cpp</option>
                      <option value="pet metaliza">pet metaliza</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>قياس 3 (mm)</label>
                    <input type="number" min="0" value={lamMeas3} onChange={e => setLamMeas3(e.target.value)} disabled={!lamMat3} />
                  </div>
                  <div className="form-group">
                    <label>MIC 3 (mm)</label>
                    <input type="number" min="0" value={lamMic3} onChange={e => setLamMic3(e.target.value)} disabled={!lamMat3} />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ---------- Finishing ---------- */}
          <section className="form-card-section">
            <h4>انهاء</h4>
            <div className="form-grid-4">
              <div className="form-group">
                <label>صمغ</label>
                <select value={glue} onChange={e => setGlue(e.target.value)}>
                  <option value="صمغ تركي">صمغ تركي</option>
                  <option value="صمغ عراقي">صمغ عراقي</option>
                  <option value="صمغ جبس">صمغ جبس</option>
                  <option value="صمغ مناديل مبللة">صمغ مناديل مبللة</option>
                </select>
              </div>
              <div className="form-group">
                <label>شكل اللف</label>
                <select value={wrapShape} onChange={e => setWrapShape(e.target.value)}>
                  <option value="a">a</option>
                  <option value="b">b</option>
                </select>
              </div>
              <div className="form-group">
                <label>قطر (mm)</label>
                <input type="number" min="0" value={wrapDiameter} onChange={e => setWrapDiameter(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>وزن (kg)</label>
                <input type="number" min="0" value={wrapWeight} onChange={e => setWrapWeight(e.target.value)} required />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>مكان التسليم</label>
                <input type="text" value={deliveryPlace} onChange={e => setDeliveryPlace(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>طريقة الدفع</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="نقد">نقد</option>
                  <option value="آجل">آجل</option>
                  <option value="تحويل صيرفي">تحويل صيرفي</option>
                  <option value="تحويل بنكي">تحويل بنكي</option>
                  <option value="عربون">عربون</option>
                  <option value="تحويل بالبطاقة">تحويل بالبطاقة</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <div className="form-group">
                <label>تفاصيل الدفع</label>
                <input type="text" value={paymentDetails} onChange={e => setPaymentDetails(e.target.value)} required />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>المجموع (دينار عراقي)</label>
                <input type="number" min="0" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} required />
              </div>
              <div className="form-group" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', height: '100%' }}>
                <label className="form-checkbox-label">
                  <input type="checkbox" checked={cutNeeded} onChange={e => setCutNeeded(e.target.checked)} />
                  <span>تقطيع</span>
                </label>
              </div>
              <div className="form-group" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', height: '100%' }}>
                <label className="form-checkbox-label">
                  <input type="checkbox" checked={packNeeded} onChange={e => setPackNeeded(e.target.checked)} />
                  <span>تغليف</span>
                </label>
              </div>
            </div>

            <div className="form-group span-full">
              <label>تفاصيل أخرى</label>
              <textarea value={extraDetails} onChange={e => setExtraDetails(e.target.value)} rows={2} />
            </div>
          </section>
        </div>

        <div className="form-modal-footer">
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">حفظ الطلبية</button>
            <button type="button" className="btn btn-outline" onClick={onCancel}>إلغاء</button>
            <button type="button" className="btn btn-secondary" disabled>طباعة (قيد التطوير)</button>
          </div>
        </div>
      </form>
    </div>
  );
}
