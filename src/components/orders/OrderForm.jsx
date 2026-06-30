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

export default function OrderForm({ onCancel, onSuccess, initialData = null, autofillData = null }) {
  const techniciansList = autofillData?.technicians || [];
  const assistantsList = autofillData?.assistants || [];
  const organizersList = autofillData?.organizers || [];
  const customersAutofill = autofillData?.customers || {};
  const customerNamesList = Object.keys(customersAutofill);

  // General section
  const [technician, setTechnician] = useState(initialData?.technician ?? '');
  const [assistant, setAssistant] = useState(initialData?.assistant_technician ?? '');
  const [shift, setShift] = useState(initialData?.shift ?? 'صباحي');
  const [orderDate, setOrderDate] = useState(initialData?.order_date ?? new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState(initialData?.customer_name ?? '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customer_phone ?? '');
  const [organizerName, setOrganizerName] = useState(initialData?.organizer_name ?? '');
  const [sector, setSector] = useState(initialData?.sector ?? '');
  const [jobDesc, setJobDesc] = useState(initialData?.functional_desc ?? '');
  const [quantityKg, setQuantityKg] = useState(initialData?.weight_kg ?? '');
  const [fasoon, setFasoon] = useState(initialData?.fasoon ?? false);

  const handleCustomerNameChange = (val) => {
    setCustomerName(val);
    if (customersAutofill[val]) {
      setCustomerPhone(customersAutofill[val]);
    }
  };
  const workTypesList = ['طباعة', 'لامنيشن', 'تغليف', 'قطع']; // example options
  const [workTypes, setWorkTypes] = useState(initialData?.job_types ?? []);

  // Production section
  const [prodLength, setProdLength] = useState(initialData?.production_length ?? '');
  const [prodWidth, setProdWidth] = useState(initialData?.production_width ?? '');
  const [designSource, setDesignSource] = useState(initialData?.design_source ?? 'نحن نصمم');
  const [clisheSource, setClisheSource] = useState(initialData?.clishe_source ?? 'نحن نكتب');
  const [printStyle, setPrintStyle] = useState(initialData?.print_style ?? 'شفاف');

  // Printing section
  const [printSubtype, setPrintSubtype] = useState(initialData?.print_subtype ?? 'سفلية');
  const [material, setMaterial] = useState(initialData?.material ?? 'bopp shiny شفاف');
  const [mic, setMic] = useState(initialData?.mic_value ?? '');
  const [printQty, setPrintQty] = useState(initialData?.print_quantity ?? '');
  const [colorCount, setColorCount] = useState(initialData?.print_color_count ?? '');
  const [materialMeasure, setMaterialMeasure] = useState(initialData?.material_measure ?? '');

  // Lamination section
  const [laminationNeeded, setLaminationNeeded] = useState(initialData?.lamination_needed ?? false);
  const [lamMat1, setLamMat1] = useState(initialData?.lamination_mat1 ?? '');
  const [lamMeas1, setLamMeas1] = useState(initialData?.lamination_meas1 ?? '');
  const [lamMic1, setLamMic1] = useState(initialData?.lamination_mic1 ?? '');
  const [lamMat2, setLamMat2] = useState(initialData?.lamination_mat2 ?? '');
  const [lamMeas2, setLamMeas2] = useState(initialData?.lamination_meas2 ?? '');
  const [lamMic2, setLamMic2] = useState(initialData?.lamination_mic2 ?? '');
  const [lamMat3, setLamMat3] = useState(initialData?.lamination_mat3 ?? '');
  const [lamMeas3, setLamMeas3] = useState(initialData?.lamination_meas3 ?? '');
  const [lamMic3, setLamMic3] = useState(initialData?.lamination_mic3 ?? '');

  // Finishing section
  const [glue, setGlue] = useState(initialData?.glue_type ?? 'صمغ تركي');
  const [cutNeeded, setCutNeeded] = useState(initialData?.cutting_needed ?? false);
  const [packNeeded, setPackNeeded] = useState(initialData?.packaging_needed ?? false);
  const [wrapShape, setWrapShape] = useState(initialData?.wrap_shape ?? 'a');
  const [wrapDiameter, setWrapDiameter] = useState(initialData?.wrap_diameter ?? '');
  const [wrapWeight, setWrapWeight] = useState(initialData?.wrap_weight ?? '');
  const [deliveryPlace, setDeliveryPlace] = useState(initialData?.delivery_location ?? '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method ?? 'نقد');
  const [paymentDetails, setPaymentDetails] = useState(initialData?.payment_details ?? '');
  const [totalAmount, setTotalAmount] = useState(initialData?.total_amount ?? '');
  const [extraDetails, setExtraDetails] = useState(initialData?.extra_details ?? '');

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
    // Validation: required fields for general section
    const requiredGeneral = [
      technician, assistant, shift, orderDate, customerName, customerPhone,
      organizerName, jobDesc, quantityKg, deliveryPlace, paymentMethod,
      paymentDetails, totalAmount
    ];
    if (requiredGeneral.some(f => f === '' || f === null)) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const isPrintEnabled = workTypes.includes('طباعة');
    const isLamEnabled = workTypes.includes('لامنيشن');
    const isPackEnabled = workTypes.includes('تغليف');

    // Printing fields validation
    if (isPrintEnabled) {
      const requiredPrint = [printSubtype, material, mic, printQty, colorCount, materialMeasure];
      if (requiredPrint.some(f => f === '' || f === null)) {
        setErrorMsg('يرجى ملء جميع حقول الطباعة المطلوبة');
        return;
      }
    }

    // Additional numeric validation (positive numbers)
    const numericFields = [
      { label: 'كمية', value: quantityKg },
      { label: 'قياس الانتاج (طول)', value: prodLength },
      { label: 'قياس الانتاج (عرض)', value: prodWidth },
      { label: 'قطر اللف', value: wrapDiameter },
      { label: 'وزن اللف', value: wrapWeight }
    ];
    
    if (isPrintEnabled) {
      numericFields.push(
        { label: 'MIC', value: mic },
        { label: 'كمية الطبع', value: printQty },
        { label: 'عدد ألوان الطباعة', value: colorCount },
        { label: 'قياس المواد', value: materialMeasure }
      );
    }

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
      sector: sector || null,
      job_types: workTypes,
      production_length: Number(prodLength),
      production_width: Number(prodWidth),
      
      // Printing fields (cleared/set to null if print is disabled)
      design_source: isPrintEnabled ? designSource : null,
      clishe_source: isPrintEnabled ? clisheSource : null,
      print_style: isPrintEnabled ? printStyle : null,
      print_subtype: isPrintEnabled ? printSubtype : null,
      material: isPrintEnabled ? material : null,
      mic_value: isPrintEnabled ? Number(mic) : null,
      print_quantity: isPrintEnabled ? Number(printQty) : null,
      print_color_count: isPrintEnabled ? Number(colorCount) : null,
      material_measure: isPrintEnabled ? Number(materialMeasure) : null,
      
      // Lamination fields (cleared/set to null if lamination is disabled)
      lamination_needed: isLamEnabled,
      lamination_mat1: isLamEnabled ? (lamMat1 || null) : null,
      lamination_meas1: isLamEnabled && lamMeas1 ? Number(lamMeas1) : null,
      lamination_mic1: isLamEnabled && lamMic1 ? Number(lamMic1) : null,
      lamination_mat2: isLamEnabled ? (lamMat2 || null) : null,
      lamination_meas2: isLamEnabled && lamMeas2 ? Number(lamMeas2) : null,
      lamination_mic2: isLamEnabled && lamMic2 ? Number(lamMic2) : null,
      lamination_mat3: isLamEnabled ? (lamMat3 || null) : null,
      lamination_meas3: isLamEnabled && lamMeas3 ? Number(lamMeas3) : null,
      lamination_mic3: isLamEnabled && lamMic3 ? Number(lamMic3) : null,
      glue_type: isLamEnabled ? glue : null,
      
      cutting_needed: false, // purged
      packaging_needed: isPackEnabled,
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
    <div className="form-overlay">
      <form className="form-modal" onSubmit={handleSubmit}>
        <div className="form-modal-header">
          <h3>{initialData ? 'تعديل الطلبية' : 'استمارة الطلبيات'}</h3>
          {errorMsg && <div className="error-banner">{errorMsg}</div>}
        </div>

        <div className="form-modal-body">
          {/* ---------- General ---------- */}
          <section className="form-card-section">
            <h4>عام</h4>
            <div className="form-grid-4">
              <div className="form-group">
                <label>الفني</label>
                <input type="text" value={technician} onChange={e => setTechnician(e.target.value)} list="technicians-list" required />
                <datalist id="technicians-list">
                  {techniciansList.map(name => <option key={name} value={name} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label>مساعد الفني</label>
                <input type="text" value={assistant} onChange={e => setAssistant(e.target.value)} list="assistants-list" required />
                <datalist id="assistants-list">
                  {assistantsList.map(name => <option key={name} value={name} />)}
                </datalist>
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
                <input type="text" value={customerName} onChange={e => handleCustomerNameChange(e.target.value)} list="customers-list" required />
                <datalist id="customers-list">
                  {customerNamesList.map(name => <option key={name} value={name} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label>رقم العميل</label>
                <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>اسم المنظم</label>
                <input type="text" value={organizerName} onChange={e => setOrganizerName(e.target.value)} list="organizers-list" required />
                <datalist id="organizers-list">
                  {organizersList.map(name => <option key={name} value={name} />)}
                </datalist>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>القطاع</label>
                <input type="text" value={sector} onChange={e => setSector(e.target.value)} />
              </div>
              <div className="form-group">
                <label>كمية (kg)</label>
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
            <div className="form-grid-4">
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
                <select value={designSource} onChange={e => setDesignSource(e.target.value)} disabled={!workTypes.includes('طباعة')}>
                  <option value="نحن نصمم">نحن نصمم</option>
                  <option value="جاهز من الزبون">جاهز من الزبون</option>
                </select>
              </div>
              <div className="form-group">
                <label>كليشة</label>
                <select value={clisheSource} onChange={e => setClisheSource(e.target.value)} disabled={!workTypes.includes('طباعة')}>
                  <option value="نحن نكتب">نحن نكتب</option>
                  <option value="جاهز من الزبون">جاهز من الزبون</option>
                </select>
              </div>
            </div>
          </section>

          {/* ---------- Printing ---------- */}
          {workTypes.includes('طباعة') && (
            <section className="form-card-section">
              <h4>الطباعة</h4>
              <div className="form-grid-4">
                <div className="form-group">
                  <label>نوع الطباعة</label>
                  <select value={printSubtype} onChange={e => setPrintSubtype(e.target.value)}>
                    <option value="سفلية">سفلية</option>
                    <option value="سطحية">سطحية</option>
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
                  <label>MIC (micron)</label>
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
                  <input
                    type="number"
                    min="0"
                    value={materialMeasure}
                    onChange={e => setMaterialMeasure(e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>
          )}

          {/* ---------- Lamination ---------- */}
          {workTypes.includes('لامنيشن') && (
            <section className="form-card-section">
              <h4>لامنيشن</h4>
              <div className="lamination-fields" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                     <input
                       type="number"
                       min="0"
                       value={lamMeas1}
                       onChange={e => setLamMeas1(e.target.value)}
                       disabled={!lamMat1}
                     />
                  </div>
                  <div className="form-group">
                    <label>MIC 1 (micron)</label>
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
                     <input
                       type="number"
                       min="0"
                       value={lamMeas2}
                       onChange={e => setLamMeas2(e.target.value)}
                       disabled={!lamMat2}
                     />
                  </div>
                  <div className="form-group">
                    <label>MIC 2 (micron)</label>
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
                     <input
                       type="number"
                       min="0"
                       value={lamMeas3}
                       onChange={e => setLamMeas3(e.target.value)}
                       disabled={!lamMat3}
                     />
                  </div>
                  <div className="form-group">
                    <label>MIC 3 (micron)</label>
                    <input type="number" min="0" value={lamMic3} onChange={e => setLamMic3(e.target.value)} disabled={!lamMat3} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ---------- Finishing ---------- */}
          <section className="form-card-section">
            <h4>انهاء</h4>
            <div className="form-grid-3">
              <div className="form-group">
                <label>شكل اللف</label>
                <select value={wrapShape} onChange={e => setWrapShape(e.target.value)}>
                  <option value="a">a: عدل</option>
                  <option value="b">b: عكس</option>
                </select>
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={wrapShape === 'a' ? '/images/wrapa.png' : '/images/wrapb.png'} 
                    alt="wrap shape" 
                    style={{ height: '70px', borderRadius: '4px', border: '1px solid var(--border)', background: '#fff', padding: '2px' }} 
                  />
                </div>
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
          </div>
        </div>
      </form>
    </div>
  );
}
