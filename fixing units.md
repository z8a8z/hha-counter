 ID 	 Page / Screen in App 	 UI Location & Field Description 	 Type (Input / Output / Print) 	 Current Unit in Code 	 Your Decision 	
:---	:---------------------	:--------------------------------	:-----------------------------	:---------------------	:--------------	
 **A** 	 Ready Orders (جاهز) → Edit Screen (تعديل طلبية) 	 Roll weight input field (per roll item entered) 	 Input 	 `غ` (suffix) / `غرام` (placeholder) 	correct	
 **B** 	 Ready Orders (جاهز) → Edit Screen (تعديل طلبية) 	 Gross Weight stat box ("إجمالي الوزن (القائم)") 	 Output 	 `غ` 	it should be in kg	
 **C** 	 Ready Orders (جاهز) → Edit Screen (تعديل طلبية) 	 Pipe Length input field label 	 Input Label 	 `سم` 	correct	
 **D** 	 Ready Orders (جاهز) → Edit Screen (تعديل طلبية) 	 Pipe Weight input field label 	 Input Label 	 `غرام` 	correct	
 **E** 	 Ready Orders (جاهز) → Edit Screen (تعديل طلبية) 	 Net Weight stat box ("الوزن الصافي") 	 Output 	 `غ` 	should be in kg	
 **F** 	 Ready Orders (جاهز) → Ready Orders Cards (List view) 	 Card footer showing net weight ("الوزن الصافي") 	 Output 	 `غ` 	should be in kg	
 **G** 	 Orders (الطلبيات) → Expanded Order Details 	 Prepared roll card showing net weight ("الوزن الصافي") 	 Output 	 `كغ` 	correct in kg , but there is a current unit transfer issue	
 **H** 	 Orders (الطلبيات) → Expanded Order Details 	 Prepared roll card showing pipe length ("طول الماسورة") 	 Output 	 `سم` 	correct	
 **I** 	 Orders (الطلبيات) → New Order Form (طلبية جديدة) 	 Requested quantity input field label ("كمية") 	 Input Label 	 `كغم` 	correct	#while you are there fix the ‘نوعية العمل’ field , it needs to be a rectangles user can enable or disable to choose , it was so in a previous stage of development
 **J** 	 Orders (الطلبيات) → New Order Form (طلبية جديدة) 	 Production length input label ("طول المنتج") 	 Input Label 	 `mm` 	correct	
 **K** 	 Orders (الطلبيات) → New Order Form (طلبية جديدة) 	 Production width input label ("عرض المنتج") 	 Input Label 	 `mm` 	correct	
 **L** 	 Orders (الطلبيات) → New Order Form (طلبية جديدة) 	 Material measure input label ("قياس الخامة") 	 Input Label 	 `mm` 	I cant find this one in the user interface , provide a report about it	
 **M** 	 Orders (الطلبيات) → New Order Form (طلبية جديدة) 	 Lamination 1 measure input label ("قياس المادة الأولى") 	 Input Label 	 `mm` 	correct	
 **N** 	 Orders (الطلبيات) → New Order Form (طلبية جديدة) 	 Lamination 2 measure input label ("قياس المادة الثانية") 	 Input Label 	 `mm` 	correct	
 **O** 	 Orders (الطلبيات) → New Order Form (طلبية جديدة) 	 Lamination 3 measure input label ("قياس المادة الثالثة") 	 Input Label 	 `mm` 	correct	#while you are there , I previously told you that ‘MIC’ is allways in mm , but the right thing is micrometer
 **P** 	 Orders (الطلبيات) → New Order Form (طلبية جديدة) 	 Wrap specification diameter input label 	 Input Label 	 `mm` 	correct	
 **Q** 	 Orders (الطلبيات) → New Order Form (طلبية جديدة) 	 Wrap specification weight input label 	 Input Label 	 `kg` 	correct	
 **R** 	 Storage (المخزن) → Rolls tab (الرولات) 	 Total rolls weight stat box at top of tab 	 Output 	 `كجم` 	correct	
 **S** 	 Storage (المخزن) → Rolls tab (الرولات) 	 Roll weight column header in rolls table 	 Output Label 	 `كجم` 	correct	
 **T** 	 Storage (المخزن) → Rolls tab (الرولات) 	 Width select option in Add Roll form dropdown 	 Input Options 	 `سم` 	cant find it	
 **U** 	 Storage (المخزن) → Rolls tab (الرولات) 	 Roll weight input label in Add Roll form 	 Input Label 	 `كجم` 	cant find it	
 **V** 	 Storage (المخزن) → Rolls tab (الرولات) 	 Width Management section header ("إدارة العروض") 	 Output Label 	 `سم` 	cant find it	
 **W** 	 Storage (المخزن) → Rolls tab (الرولات) 	 Width input placeholder in Width Management form 	 Input Placeholder	 `سم` 	cant find it	
 **X** 	 Storage (المخزن) → Rolls tab (الرولات) 	 Width value displayed in managed widths list 	 Output 	 `سم` 	correct	
 **Y** 	 Storage (المخزن) → Pipes tab (المواسير) 	 Length select option in Add Pipe form dropdown 	 Input Options 	 `سم` 	cant find it	
 **Z** 	 Storage (المخزن) → Pipes tab (المواسير) 	 Length Management section header ("إدارة الأطوال") 	 Output Label 	 `سم` 	cant find it	
 **AA**	 Storage (المخزن) → Pipes tab (المواسير) 	 Length input placeholder in Length Management form 	 Input Placeholder	 `سم` 	cant find it	
 **AB**	 Storage (المخزن) → Pipes tab (المواسير) 	 Length value displayed in managed lengths list 	 Output 	 `سم` 	correct	
 **AC**	 Storage (المخزن) → Inks tab (الأحبار) 	 Total inks weight stat box at top of tab 	 Output 	 `كجم` 	correct	
 **AD**	 Storage (المخزن) → Inks tab (الأحبار) 	 Ink quantity column header in inks table 	 Output Label 	 `كجم` 	correct	
 **AE**	 Storage (المخزن) → Inks tab (الأحبار) 	 Quantity input label in Add Ink form 	 Input Label 	 `كجم` 	cant find it	
 **AF**	 Storage (المخزن) → Inks tab (الأحبار) 	 Barrel Weight Management header ("أوزان البراميل") 	 Output Label 	 `كجم` 	cant find it	
 **AG**	 Storage (المخزن) → Inks tab (الأحبار) 	 Barrel weight placeholder in Weight Management form 	 Input Placeholder	 `كجم` 	cant find it	
 **AH**	 Storage (المخزن) → Inks tab (الأحبار) 	 Barrel weight displayed in managed weights list 	 Output 	 `كجم` 	cant find it	
 **AI**	 Storage (المخزن) → Liquids tab (السوائل) 	 Quantity input label in Add Liquid form 	 Input Label 	 `لتر` 	cant find it	
 **AJ**	 Storage (المخزن) → Liquids tab (السوائل) 	 Unit column in liquids table 	 Output 	 Dynamic (from database `item.unit`) 	it should be fixed to letter allways	
 **AK**	 Storage View (عرض المخزن) → Rolls tab 	 Total rolls weight stat box at top of view 	 Output 	 `kg` 	correct	notice that I can find one tab in the app named “storage” , and there is no “storage view tab” , I am testing the user interface only
 **AL**	 Storage View (عرض المخزن) → Rolls tab 	 Weight column header in rolls view table 	 Output Label 	 `كجم` 	correct	
 **AM**	 Storage View (عرض المخزن) → Rolls tab 	 Width filter tags 	 Output 	 `cm` 	correct	
 **AN**	 Storage View (عرض المخزن) → Pipes tab 	 Total pipes count stat box at top of view 	 Output 	 `pcs` 	Correct	
 **AO**	 Storage View (عرض المخزن) → Pipes tab 	 Length filter tags 	 Output 	 `cm` 	correct 	
 **AP**	 Storage View (عرض المخزن) → Liquids tab 	 Total liquids volume stat box at top of view 	 Output 	 `liter` 	Correct	
 **AQ**	 Storage View (عرض المخزن) → Inks tab 	 Total inks weight stat box at top of view 	 Output 	 `kg` 	Correct	
 **AR**	 Storage View (عرض المخزن) → Inks tab 	 Quantity column header in inks view table 	 Output Label 	 `كجم` 	Correct	
 **AS**	 Purchases (المشتريات) → Add Purchase form 	 Roll quantity label 	 Input Label 	 `كجم` 	Correct , the displayed tag is roll weigth , and thats right too	
 **AT**	 Purchases (المشتريات) → Add Purchase form 	 Liquid quantity label 	 Input Label 	 `لتر` 	correct	
 **AU**	 Purchases (المشتريات) → Add Purchase form 	 Roll width dropdown options 	 Input Options 	 `سم` 	correct 	
 **AV**	 Purchases (المشتريات) → Add Purchase form 	 Pipe length dropdown options 	 Input Options 	 `سم` 	correct 	
 **AW**	 Purchases (المشتريات) → Add Purchase form 	 Ink barrel weight label 	 Input Label 	 `كجم` 	correct 	
 **AX**	 Purchases (المشتريات) → Add Purchase form 	 Ink barrel weight dropdown options 	 Input Options 	 `كجم` 	correct 	
 **AY**	 Settings (الإعدادات) → Variations tab 	 Roll Widths table column header 	 Output Label 	 `سم` / `cm` mixed 	it is cm , unify all the units throughout all the app to be in english	
 **AZ**	 Settings (الإعدادات) → Variations tab 	 Roll Width input placeholder 	 Input Placeholder	 `سم` 	correct 	
 **BA**	 Settings (الإعدادات) → Variations tab 	 Roll width value displayed in variations table 	 Output 	 `cm` 	correct 	
 **BB**	 Settings (الإعدادات) → Variations tab 	 Pipe Lengths table column header 	 Output Label 	 `سم` / `cm` mixed 	Correct , cm	
 **BC**	 Settings (الإعدادات) → Variations tab 	 Pipe Length input placeholder 	 Input Placeholder	 `سم` 	correct 	
 **BD**	 Settings (الإعدادات) → Variations tab 	 Pipe length value displayed in variations table 	 Output 	 `cm` 	correct 	
 **BE**	 Settings (الإعدادات) → Variations tab 	 Ink Weights table column header 	 Output Label 	 `كجم` / `kg` mixed 	correct 	
 **BF**	 Settings (الإعدادات) → Variations tab 	 Ink Weight input placeholder 	 Input Placeholder	 `كجم` 	correct 	
 **BG**	 Settings (الإعدادات) → Variations tab 	 Ink weight value displayed in variations table 	 Output 	 `kg` 	correct 	
 **BH**	 Print (المطبوعات) → Management Print (طلبية إدارة) 	 Order quantity row 	 Print Label 	 `كغم` 	correct 	
 **BI**	 Print (المطبوعات) → Management Print (طلبية إدارة) 	 Product dimensions (Length × Width) 	 Print 	 `مم` 	correct 	
 **BJ**	 Print (المطبوعات) → Management Print (طلبية إدارة) 	 Material measure row 	 Print 	 `مم` 	correct 	
 **BK**	 Print (المطبوعات) → Management Print (طلبية إدارة) 	 Lamination material measurements rows 	 Print 	 `مم` 	correct 	
 **BL**	 Print (المطبوعات) → Management Print (طلبية إدارة) 	 Wrap spec diameter 	 Print 	 `مم` 	correct 	
 **BM**	 Print (المطبوعات) → Management Print (طلبية إدارة) 	 Wrap spec weight 	 Print 	 `كجم` 	correct 	
 **BN**	 Print (المطبوعات) → Work Order Print (أمر ورشة) 	 Order quantity row 	 Print Label 	 `كغم` 	correct 	
 **BO**	 Print (المطبوعات) → Work Order Print (أمر ورشة) 	 Product dimensions 	 Print 	 `مم` 	correct 	
 **BP**	 Print (المطبوعات) → Work Order Print (أمر ورشة) 	 Material measure 	 Print 	 `مم` 	correct 	
 **BQ**	 Print (المطبوعات) → Work Order Print (أمر ورشة) 	 Lamination material measurements 	 Print 	 `مم` 	correct 	
 **BR**	 Print (المطبوعات) → Work Order Print (أمر ورشة) 	 Wrap specifications 	 Print 	 `مم` (diameter), `كجم` (weight) 	correct 	
 **BS**	 Print (المطبوعات) → Prep Card Print (بطاقة تجهيز) 	 Rolls weight table columns (Gross/Net) 	 Print Label 	 `كجم` 	correct 	
 **BT**	 Print (المطبوعات) → Prep Card Print (بطاقة تجهيز) 	 Gross weight total 	 Print 	 `كجم` 	correct 	
 **BU**	 Print (المطبوعات) → Prep Card Print (بطاقة تجهيز) 	 Pipe length 	 Print 	 `سم` 	correct 	
 **BV**	 Print (المطبوعات) → Prep Card Print (بطاقة تجهيز) 	 Pipe weight 	 Print 	 `كجم` 	correct 	
 **BW**	 Print (المطبوعات) → Prep Card Print (بطاقة تجهيز) 	 Net weight total 	 Print 	 `كجم` 	correct 	