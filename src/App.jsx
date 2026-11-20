import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, ChevronDown, CircleHelp, Clock3, Download, FileText, Heart, Menu, MessageCircle, ShieldCheck, Sparkles, Star, X } from 'lucide-react';
import { supabase } from './lib/supabase';

const sections = [
  {title:'الصلاة',color:'teal',items:['من الأذان لنهاية الصلاة','طريقة الصلاة','تدبر الصلاة','أذكار ما بعد الصلاة','ثواب الصلاة وعقاب تركها','قضاء الصلاة وقصرها','قيام الليل','الفجر وركعتا السنة','حي على الفلاح']},
  {title:'الصوم والحج والأعياد',color:'gold',items:['الصوم وآدابه وأوقاته','بلانر رمضان','العمرة والمحظورات والنظافة (1)','الحج: خطوة بخطوة (2)','الحج والعمرة (3)','يوم عرفة: إزاي تستغله صح','صلاة العيدين']},
  {title:'الآخرة والتوبة وتزكية النفس',color:'pink',items:['الجنة والنار','نعيم الجنة في القرآن','عذاب النار في القرآن','التوبة وصلاة التوبة','وقفة مع النفس','الشيطان: العدو الأبدي للإنسان','عادات لازم نتجنبها','السبع الموبقات وعقوباتها وكفاراتها','الجنائز']},
  {title:'الحجاب والحياء والآداب وصفحات الشباب',color:'rose',items:['العورة والمحارم والرضاعة','الحجاب','نصيحة للشباب','الغِيبة والنميمة','الموسيقى والأغاني','طريقة الكلام: هذب لسانك']},
  {title:'الأسرة والمعاملات',color:'mint',items:['حقوق الوالدين والأرحام والجيران','الزواج والأسرة','الكسب الحلال والربا والزكاة','احسب زكاتك والصدقة الجارية']},
  {title:'الصحة والدراسة والمعرفة',color:'purple',items:['روتين النظافة الشخصية','القضاء على تعفن الدماغ','التحاليل والفيتامينات','طريقة المذاكرة','بودكاست مفيدة']},
  {title:'القرآن الكريم',color:'orange',items:['بستان القرآن الكريم','جدول حفظ القرآن']}
];
const products = [
 {id:'pdf',name:'نسخة PDF للطباعة',price:59,description:'ملف PDF للطباعة بمقاسي A4 وA5، مرتب مثل الكراسة.',features:['124 صفحة','مقاس A4 وA5','جاهز للطباعة']},
 {id:'interactive',name:'النسخة التفاعلية',price:49,description:'نسخة رقمية تفاعلية تقدر تعلم وتكتب فيها من الموبايل أو الكمبيوتر.',features:['متابعة العادات والصلوات','تكتب وتحفظ تقدمك','تعمل على الموبايل والكمبيوتر']},
 {id:'printed',name:'النسخة المطبوعة',price:89,description:'كراسة مطبوعة جاهزة للاستخدام، السعر قابل للتعديل من لوحة التحكم.',features:['كراسة مطبوعة','ترتيب صفحات البلانر','تأكيد تفاصيل الشحن لاحقًا']}
];
function Header(){return <header className="topbar"><a href="#home" className="brand"><span className="brand-mark">م</span><span>ملتزم<small>بلانر يومي بأسلوب حياة</small></span></a><nav><a href="#preview">المعاينة</a><a href="#contents">الفهرس</a><a href="#versions">النسخ والأسعار</a><a href="#faq">الأسئلة الشائعة</a></nav><a className="nav-cta" href="#versions">اطلب نسختك <ArrowLeft size={16}/></a></header>}
function StickyBuy(){return <div className="sticky-buy"><span>ابدأ يومك بخطوة صغيرة</span><a className="btn btn-gold" href="#versions">اطلب الآن <ArrowLeft size={17}/></a></div>}
function Hero(){return <section className="hero" id="home"><div className="hero-pattern"/><div className="hero-copy"><span className="eyebrow"><Sparkles size={15}/> 31 يوم من الالتزام بخطوة صغيرة</span><h1>مش لازم تغيّر حياتك<br/><em>في يوم واحد.</em></h1><p>كل يوم ورقة بلانر وورقة فضفضة: عبادتك، دراستك، رياضتك، مهاراتك ولغاتك. نظّم يومك وتعلّم بإيدك.</p><div className="tag-row"><span>Worship</span><span>Sports</span><span>Study</span><span>Skills</span><span>Languages</span></div><div className="hero-actions"><a className="btn btn-gold" href="#versions">اطلب دلوقتي <ArrowLeft/></a><a className="btn btn-outline" href="#contents">شوف الفهرس</a></div><div className="micro-trust"><span><Check/> اطلب من واتساب في دقيقة</span><span><Check/> ادفع بالطريقة المناسبة</span><span><Check/> استلم نسختك بعد التأكيد</span></div></div><div className="hero-art"><div className="book-shadow"/><div className="book-cover"><div className="cover-kicker">DAILY PLANNER</div><div className="cover-title">ملتزم</div><div className="cover-sub">مش لازم تغيّر حياتك.. ابدأ بخطوة</div><div className="pulse-line">♡ ━━━━━ ♡</div><div className="cover-seal">31<small>daily sheets</small></div><div className="cover-categories"><i>Worship</i><i>Sports</i><i>Study</i><i>Skills</i><i>Languages</i></div><div className="cover-bottom">The most beloved deeds are the most consistent, even if small.</div></div><div className="float-note">خطوة صغيرة كل يوم ✦</div></div></section>}
function Stats(){return <section className="stats wrap"><div><b>31</b><span>يوم التزام</span></div><div><b>124</b><span>صفحة</span></div><div><b>A4 + A5</b><span>مقاسات للطباعة</span></div><div><b>114</b><span>سورة في بستان القرآن*</span></div><small>* أرقام ومواصفات أولية وفق المادة التسويقية المرسلة، وتُراجع قبل النشر النهائي.</small></section>}
function Preview(){return <section className="section wrap" id="preview"><div className="section-head"><span className="eyebrow">نظرة من الداخل</span><h2>كل يوم.. صفحة تقرّبك من هدفك</h2><p>مساحة تجمع عبادتك وعاداتك ودراستك ومهاراتك في مكان واحد.</p></div><div className="preview-grid"><div className="sample-sheet"><div className="sheet-head"><b>بلانر اليوم</b><span>اليوم 01 / 31</span></div><div className="sheet-cols"><div><b>عبادتي</b>{['الفجر','الظهر','العصر','المغرب','العشاء'].map(x=><label key={x}><i/>{x}</label>)}</div><div><b>يومي</b>{['أهم 3 أولويات','مهمة أنجزتها','شيء ممتن له','وقفة مع النفس'].map(x=><label key={x}><i/>{x}</label>)}</div></div><div className="sheet-footer">الأعمال أحب إلى الله أدومها وإن قل</div></div><div className="preview-notes"><article><span className="number">01</span><h3>يومك في صفحة واحدة</h3><p>الصلاة والأذكار والورد والرياضة والمذاكرة والمهارات واللغات.</p></article><article><span className="number orange">02</span><h3>علامة صح تحسّسك</h3><p>دوائر تعلم عليها كل ما تخلص حاجة، وتقييم لنهاية اليوم.</p></article><article><span className="number purple">03</span><h3>اطبعه أو سجّل أونلاين</h3><p>نسخة PDF للطباعة ونسخة تفاعلية تقدر تستخدمها من الموبايل.</p></article></div></div></section>}
function Contents(){return <section className="section contents-section" id="contents"><div className="wrap"><div className="section-head"><span className="eyebrow">اكتشف المحتوى</span><h2>الفهرس.. كل حاجة في مكانها</h2><p>أقسام البلانر مرتبة لتسهّل عليك الوصول للموضوع اللي محتاجه.</p></div><div className="contents-grid">{sections.map((s,i)=><article className={`content-card ${s.color}`} key={s.title}><h3><span>{String(i+1).padStart(2,'0')}</span>{s.title}</h3><ol>{s.items.map((it,j)=><li key={it}><span>{it}</span><b>{i===0?66+j:i===1?76+j:i===2?84+j:94+j}</b></li>)}</ol></article>)}</div></div></section>}
function Benefits(){return <section className="section wrap"><div className="section-head"><span className="eyebrow">ليه بلانر؟</span><h2>الالتزام بيتبني بخطوة صغيرة كل يوم</h2></div><div className="benefit-grid"><article><BookOpen/><h3>يومك في صفحة واحدة</h3><p>تابع عبادتك وعاداتك وأهدافك بدون ما تفتح خمس تطبيقات.</p></article><article><Check/><h3>علامة صح بتحسّسك</h3><p>تابع إنجازاتك وشوف تقدمك مع نهاية كل يوم.</p></article><article><Download/><h3>اطبعه أو سجّل أونلاين</h3><p>اختار الطريقة اللي تناسبك: PDF للطباعة أو نسخة تفاعلية.</p></article></div></section>}

function ProductCards({ products = [] }) {
  return (
    <section className="section product-section" id="versions">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">اختار نسختك</span>
          <h2>ابدأ رحلتك من النهارده</h2>
          <p>اختار النسخة المناسبة ليك، وبعدها كمّل بيانات الطلب.</p>
        </div>

        <div className="product-grid">
          {products.map((p, i) => (
            <article
              className={`product-card ${i === 1 ? 'featured' : ''}`}
              key={p.id}
            >
              {i === 1 && <span className="popular">نسخة تفاعلية</span>}

              <div className="product-icon">
                {i === 0 ? <FileText /> : i === 1 ? <Sparkles /> : <BookOpen />}
              </div>

              <h3>{p.name}</h3>
              <p>{p.description || 'اختار النسخة المناسبة ليك وابدأ تنظيم يومك.'}</p>

              <div className="price">
                <b>{p.price}</b>
                <span>جنيه</span>
              </div>

              <ul>
                {(p.features || []).map(f => (
                  <li key={f}>
                    <Check size={16} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                className={`btn ${i === 1 ? 'btn-teal' : 'btn-gold'} full`}
                to={`/order/${p.id}`}
              >
                اطلب النسخة <ArrowLeft size={17} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Steps(){return <section className="section wrap"><div className="section-head"><span className="eyebrow">إزاي تطلب؟</span><h2>أربع خطوات بسيطة</h2></div><div className="steps-grid">{['اختار النسخة واضغط اطلب','اكتب بياناتك الأساسية','حوّل المبلغ وارفع صورة الإيصال','بعد المراجعة استلم رابط نسختك'].map((s,i)=><article key={s}><b>{i+1}</b><h3>{s}</h3></article>)}</div></section>}
function Feedback(){const [kind,setKind]=useState('اقتراح');const [bought,setBought]=useState('لسه ما اشتريتش');const [message,setMessage]=useState('');const [name,setName]=useState('');const [sent,setSent]=useState(false);async function submit(e){e.preventDefault();if(supabase){const {error}=await supabase.from('feedback').insert({kind,purchased:bought,message,name:name||null});if(error){alert('تعذر إرسال رأيك الآن. تأكد من إعداد قاعدة البيانات.');return;}}else{localStorage.setItem('planner-feedback-draft',JSON.stringify({kind,bought,message,name}));}setSent(true)}return <section className="section wrap" id="feedback"><div className="feedback-box"><div><span className="eyebrow">صوتك يفرق</span><h2>ناقصه حاجة؟ قولنا</h2><p>سواء اشتريت البلانر أو لسه بتتفرج، رأيك بيساعدنا نطوره.</p></div><form onSubmit={submit}><label>رأيك في إيه؟</label><div className="choice-row">{['حاجة ناقصة','معلومة أو صفحة','مشكلة واجهتني','اقتراح'].map(x=><button type="button" className={kind===x?'selected':''} onClick={()=>setKind(x)} key={x}>{x}</button>)}</div><label>اشتريت البلانر؟</label><div className="choice-row"><button type="button" className={bought==='أيوه اشتريته'?'selected':''} onClick={()=>setBought('أيوه اشتريته')}>أيوه اشتريته</button><button type="button" className={bought==='لسه ما اشتريتش'?'selected':''} onClick={()=>setBought('لسه ما اشتريتش')}>لسه ما اشتريتش</button></div><textarea required maxLength={600} value={message} onChange={e=>setMessage(e.target.value)} placeholder="اكتب بالتفصيل اللي تحبه..."/><input value={name} onChange={e=>setName(e.target.value)} placeholder="اسمك (اختياري)"/><button className="btn btn-green full" type="submit">{sent?'تم تسجيل رأيك':'ابعت رأيك'}</button></form></div></section>}
const faqs=[['أطبع الكراسة إزاي؟','تقدر تطبع نسخة PDF بمقاس A4 أو A5، مع اختيار إعدادات الطباعة المناسبة.'],['اللي بكتبه وبعلم عليه بيتحفظ؟','في النسخة التفاعلية يعتمد الحفظ على التطبيق أو البرنامج المستخدم وطريقة فتح الملف.'],['بيشتغل على الموبايل؟','النسخة التفاعلية مصممة للاستخدام من الموبايل والكمبيوتر، مع اختلاف بعض الخصائص حسب التطبيق.'],['لازم حساب Google عشان أستلم؟','هنرسل رابط الاستلام على البريد الإلكتروني الذي تكتبه في الطلب.'],['إمتى بستلم الملف؟','بعد مراجعة إيصال التحويل والموافقة على الطلب، يتم إرسال رابط الاستلام.']];
function FAQ(){const [open,setOpen]=useState(0);return <section className="section wrap" id="faq"><div className="section-head"><span className="eyebrow">محتاج تعرف إيه؟</span><h2>أسئلة بتتسأل كتير</h2></div><div className="faq-list">{faqs.map(([q,a],i)=><article key={q}><button onClick={()=>setOpen(open===i?-1:i)}>{q}{open===i?<X/>:<ChevronDown/>}</button>{open===i&&<p>{a}</p>}</article>)}</div></section>}
function Footer(){return <footer><div className="wrap footer-inner"><div><h2>ابدأ يومك الأول النهارده</h2><p>31 يوم، وكل يوم خطوة صغيرة.</p></div><a className="btn btn-gold" href="#versions">اطلب دلوقتي <ArrowLeft/></a></div><div className="footer-bottom">ملتزم · بلانر يومي <span>الأعمال أحب إلى الله أدومها وإن قل</span></div></footer>}
function Home() {
  const [storeProducts, setStoreProducts] = useState(products);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      if (!supabase) return;

      const { data, error } = await supabase.functions.invoke(
        'storefront-config',
        { body: {} }
      );

      if (!active || error || !Array.isArray(data?.products)) return;

      if (data.products.length > 0) {
        const updatedProducts = products.map(defaultProduct => {
          const remoteProduct = data.products.find(
            item => item.id === defaultProduct.id
          );

          return remoteProduct
            ? { ...defaultProduct, ...remoteProduct }
            : defaultProduct;
        });

        setStoreProducts(updatedProducts);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <Preview />
        <Benefits />
       <Contents />

<ProductCards products={storeProducts} />

<Steps />
        <Feedback />
        <FAQ />
      </main>
      <Footer />
      <StickyBuy />
    </>
  );
}
function Order() {
  const { id } = useParams();
  const product = products.find(item => item.id === id);
  const [form, setForm] = useState({ name: '', email: '', phone: '', payment: '', note: '' });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentLoadError, setPaymentLoadError] = useState('');
  const [copiedPayment, setCopiedPayment] = useState('');
  const [proof, setProof] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [trackingToken, setTrackingToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadPaymentMethods() {
      if (!supabase) {
        setPaymentLoadError('تعذر تحميل طرق الدفع الآن.');
        return;
      }
      let data;
      let loadError;
      const storefront = await supabase.functions.invoke('storefront-config', { body: {} });
      if (!storefront.error && !storefront.data?.error && Array.isArray(storefront.data?.paymentMethods)) {
        data = storefront.data.paymentMethods;
      } else {
        let direct = await supabase
          .from('payment_methods')
          .select('*')
          .eq('is_active', true)
          .order('method_code');
        if (direct.error) {
          direct = await supabase
            .from('payment_method')
            .select('*')
            .eq('is_active', true);
        }
        if (direct.error) {
          direct = await supabase
            .from('payment_method')
            .select('*')
            .eq('active', true);
        }
        data = direct.data;
        loadError = direct.error;
      }
      if (!active) return;
      if (loadError) {
        setPaymentLoadError('تعذر تحميل طرق الدفع. حدّث الصفحة أو تواصل معنا.');
        return;
      }
      const methods = (data || []).map(method => ({
        ...method,
        method_code: method.method_code || method.id,
        display_name: method.display_name || method.label || method.method_code || method.id,
        payment_identifier: method.payment_identifier || method.account_value || '',
        instructions: method.instructions || (method.method_code === 'instapay'
          ? 'حوّل المبلغ إلى حساب InstaPay الموضح، واكتب رقم الطلب في ملاحظات التحويل إن أمكن.'
          : 'حوّل المبلغ إلى رقم Vodafone Cash الموضح، ثم ارفع صورة الإيصال لإتمام الطلب.')
      }));
      setPaymentMethods(methods);
      setForm(current => ({
        ...current,
        payment: methods.some(method => method.display_name === current.payment)
          ? current.payment
          : (methods[0]?.display_name || '')
      }));
    }
    loadPaymentMethods();
    return () => { active = false; };
  }, []);

  async function copyPayment(identifier, methodCode) {
    try {
      await navigator.clipboard.writeText(identifier);
      setCopiedPayment(methodCode);
      window.setTimeout(() => setCopiedPayment(''), 1800);
    } catch {
      setError('تعذر نسخ الرقم تلقائيًا. حدده وانسخه يدويًا.');
    }
  }

  async function saveOrder(event) {
    event.preventDefault();
    if (!supabase || !proof) {
      setError('تعذر الاتصال بالخدمة أو لم يتم اختيار إيصال الدفع.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const orderData = new FormData();
      orderData.append('name', form.name.trim());
      orderData.append('email', form.email.trim());
      orderData.append('phone', form.phone.trim());
      orderData.append('productId', product.id);
      const selectedPaymentMethod = paymentMethods.find(
  (method) => method.id === form.payment || method.label === form.payment
);
orderData.append('paymentMethod', selectedPaymentMethod?.label || form.payment);
      orderData.append('note', form.note.trim());
      orderData.append('proof', proof);

      const { data, error: requestError } = await supabase.functions.invoke('create-order', { body: orderData });
      if (requestError || data?.error || !data?.orderId || !data?.trackingToken) {
        throw new Error('تعذر إرسال الطلب الآن. حاول مرة أخرى بعد قليل.');
      }
      setOrderId(data.orderId);
      setTrackingToken(data.trackingToken);
    } catch {
      setError('تعذر إرسال الطلب الآن. تأكد من نشر خدمة الطلبات وإعدادها، ثم حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  }

  if (!product) {
    return <div className="order-page"><div className="order-card"><h1>النسخة غير موجودة</h1><Link className="back-link" to="/">العودة للصفحة الرئيسية</Link></div></div>;
  }

  if (orderId) {
    return (
      <div className="order-page">
        <div className="order-card success">
          <ShieldCheck size={42} />
          <h1>تم إرسال طلبك بنجاح</h1>
          <p>رقم الطلب: {orderId}</p>
          <Link className="btn btn-gold full" to={`/track-order#${encodeURIComponent(trackingToken)}`}>متابعة الطلب بأمان</Link>
          <small>احتفظ برابط المتابعة؛ لن تحتاج إلى رقم الهاتف لمشاهدة حالتك.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page">
      <Link className="back-link" to="/">العودة للمتجر</Link>
      <div className="order-card">
        <span className="eyebrow">{product.name}</span>
        <h1>تأكيد الطلب</h1>
        <div className="order-total"><span>الإجمالي</span><b>{product.price} جنيه</b></div>
        <form className="order-form" onSubmit={saveOrder}>
          <label>الاسم الكامل<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
          <label>البريد الإلكتروني<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
          <label>رقم الهاتف<input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></label>
          <label>طريقة الدفع<select value={form.payment} onChange={e => setForm({ ...form, payment: e.target.value })} required disabled={!paymentMethods.length}><option value="">{paymentMethods.length ? 'اختار طريقة الدفع' : 'لا توجد طريقة دفع متاحة'}</option>{paymentMethods.map(method => <option key={method.method_code || method.display_name} value={method.display_name}>{method.display_name}</option>)}</select></label>
          {paymentLoadError && <p className="error" role="alert">{paymentLoadError}</p>}
          <div className="payment-method-list" aria-label="تفاصيل طرق الدفع">{paymentMethods.map(method => <article className={`payment-method-card ${method.method_code}`} key={method.method_code || method.display_name}><h3>{method.display_name}</h3><strong dir="ltr">{method.payment_identifier}</strong><p>{method.instructions}</p><button className="btn btn-outline" type="button" disabled={!method.payment_identifier} onClick={() => copyPayment(method.payment_identifier, method.method_code)}>{copiedPayment === method.method_code ? 'تم النسخ ✓' : 'نسخ الرقم'}</button></article>)}</div>
          <div className="payment-info"><b>إيصال الدفع</b><p>ارفع صورة أو ملف الإيصال لتأكيد طلبك.</p><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setProof(e.target.files?.[0] || null)} required /></div>
          <label>ملاحظات (اختياري)<textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
          <button className="btn btn-gold full" type="submit" disabled={saving || !paymentMethods.length}>{saving ? 'جاري الإرسال...' : 'إرسال الطلب'}</button>
          <small>لن يتم تأكيد الطلب إلا بعد مراجعة الإيصال.</small>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
function AdminLogin(){const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');async function login(e){e.preventDefault();if(!supabase){setError('أضف مفاتيح Supabase في ملف .env أولاً.');return;}const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setError(error.message);else location.href='/admin';}return <div className="order-page"><div className="order-card"><span className="eyebrow">إدارة المتجر</span><h1>دخول الأدمن</h1><form className="order-form" onSubmit={login}><label>البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>كلمة المرور<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="btn btn-gold full">تسجيل الدخول</button>{error&&<p className="error">{error}</p>}</form></div></div>}

function TrackOrder() {
  const [trackingToken, setTrackingToken] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = window.location.hash.slice(1);
    if (token) {
      setTrackingToken(token);
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  async function searchOrder(e) {
    e?.preventDefault();
    if (!supabase || !trackingToken.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    const { data, error } = await supabase.functions.invoke('track-order', {
      body: { trackingToken: trackingToken.trim() }
    });

    setLoading(false);

    if (error) {
      setError('حصل خطأ، حاول مرة تانية');
      return;
    }

    if (!data?.order) {
      setError('رمز المتابعة غير صحيح أو لم يعد متاحًا.');
      return;
    }

    setResult(data.order);
  }

  return (
    <div className="order-page">
      <div className="order-card">
        <span className="eyebrow">متابعة الطلب</span>
        <h1>تتبع طلبك</h1>

        <form className="order-form" onSubmit={searchOrder}>
          <label>
            رمز المتابعة الخاص بطلبك
            <input
              type="password"
              autoComplete="off"
              value={trackingToken}
              onChange={e => setTrackingToken(e.target.value)}
              placeholder="أدخل رمز المتابعة الذي ظهر بعد الإرسال"
              required
            />
          </label>

          <button className="btn btn-gold full" disabled={loading}>
            {loading ? 'جاري البحث...' : 'تتبع الطلب'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {result && (
          <div className="success">
            <h3>{result.product_name}</h3>
            <p>حالة الطلب: {result.status}</p>
            {result.delivery_url && (
              <a href={result.delivery_url} target="_blank" rel="noreferrer">
                استلام المنتج
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function Admin() {
  const [session, setSession] = useState(undefined);
  const [authorized, setAuthorized] = useState(false);
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productBusy, setProductBusy] = useState('');
  const [productMessage, setProductMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, s) => setSession(s));

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) checkAdmin();
  }, [session]);

  async function checkAdmin() {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!error && data?.role === 'admin') {
      setAuthorized(true);
      loadData();
    } else {
      setAuthorized(false);
    }
  }

  async function loadData() {
    setBusy('loading');

    const [ordersResult, feedbackResult] = await Promise.all([
      supabase.from('orders').select('*')
        .order('created_at', { ascending: false }),
      supabase.from('feedback').select('*')
        .order('created_at', { ascending: false })
    ]);

    if (ordersResult.error) {
      alert('تعذر تحميل الطلبات: ' + ordersResult.error.message);
    } else {
      setOrders(ordersResult.data || []);
    }

    if (feedbackResult.error) {
      alert('تعذر تحميل الآراء: ' + feedbackResult.error.message);
    } else {
      setFeedback(feedbackResult.data || []);
    }

    setBusy('');
  }

  async function loadProducts() {
    setProductsLoading(true);
    setProductMessage('');
    const { data, error } = await supabase
      .from('product_catalog')
      .select('id, name, price, old_price, active, updated_at')
      .order('name');

    if (error) {
      setProductMessage('تعذر تحميل المنتجات: ' + error.message);
    } else {
      setProducts(data || []);
    }
    setProductsLoading(false);
  }

  async function saveProduct(product) {
    const price = Number(product.price);
    const oldPrice = product.old_price === '' || product.old_price == null
      ? null
      : Number(product.old_price);

    if (!Number.isFinite(price) || price < 0 || (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0))) {
      setProductMessage('أدخل أسعارًا صحيحة أكبر من أو تساوي صفرًا.');
      return;
    }

    setProductBusy(product.id);
    setProductMessage('');
    const updatedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from('product_catalog')
      .update({ price, old_price: oldPrice, active: product.active, updated_at: updatedAt })
      .eq('id', product.id)
      .select('id, name, price, old_price, active, updated_at')
      .single();

    if (error) {
      setProductMessage('تعذر حفظ التعديلات: ' + error.message);
    } else {
      setProducts(current => current.map(item => item.id === product.id ? data : item));
      setProductMessage('تم حفظ تعديلات المنتج.');
    }
    setProductBusy('');
  }
  async function changeStatus(id, next) {
    const { error } = await supabase
      .from('orders')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      alert('فشل تحديث الحالة: ' + error.message);
      return;
    }

    await loadData();
  }

  async function viewProof(path) {
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(path, 300);

    if (error) {
      alert('تعذر فتح الإيصال: ' + error.message);
      return;
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function setDelivery(order) {
    const url = window.prompt(
      'أدخل رابط تسليم النسخة للعميل:',
      order.delivery_url || ''
    );

    if (url === null) return;

    const { error } = await supabase
      .from('orders')
      .update({
        delivery_url: url.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (error) {
      alert('تعذر حفظ رابط التسليم: ' + error.message);
      return;
    }

    await loadData();
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setAuthorized(false);
  }

  if (loading) {
    return <div className="order-page">جاري التحميل...</div>;
  }

  if (!session) {
    return (
      <div className="order-page">
        <div className="order-card">
          <h1>لوحة التحكم</h1>
          <p>سجّل الدخول بحساب الإدارة.</p>
          <Link className="btn btn-gold full" to="/admin/login">
            دخول الأدمن
          </Link>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="order-page">
        <div className="order-card">
          <h1>لا تملك صلاحية الدخول</h1>
          <p>الحساب الحالي غير مضاف كمسؤول.</p>
          <button className="btn btn-outline full" onClick={logout}>
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  const pending = orders.filter(o => o.status === 'pending').length;
 const approved = orders.filter(o => ['approved', 'delivered'].includes(o.status)).length;

  return (
    <div className="admin-page" dir="rtl">
      <header>
        <h1>لوحة التحكم — ملتزم</h1>
        <div>
          <button onClick={loadData}>تحديث البيانات</button>
          <button onClick={logout}>تسجيل الخروج</button>
        </div>
      </header>

      <div className="admin-stats">
        <article><b>{orders.length}</b><span>كل الطلبات</span></article>
        <article><b>{pending}</b><span>في انتظار المراجعة</span></article>
        <article><b>{approved}</b><span>تمت الموافقة</span></article>
        <article><b>{feedback.length}</b><span>آراء العملاء</span></article>
      </div>

      <div className="admin-tabs">
        <button onClick={() => setTab('orders')}>الطلبات</button>
        <button onClick={() => setTab('feedback')}>آراء العملاء</button>
        <button onClick={() => { setTab('products'); loadProducts(); }}>المنتجات والأسعار</button>
      </div>

      {busy === 'loading' && <p>جاري تحديث البيانات...</p>}

      {tab === 'orders' && (
        <section className="admin-table">
          <h2>طلبات العملاء</h2>

          {orders.length === 0 ? (
            <p>لا توجد طلبات حتى الآن.</p>
          ) : orders.map(order => (
            <article key={order.id}>
              <div>
                <b>{order.customer_name}</b>
                <span>{order.product_name} · {order.amount} جنيه</span>
                <small>{order.email} · {order.phone}</small>
                <small>طريقة الدفع: {order.payment_method}</small>
                <small>الحالة: {order.status}</small>

                {order.note && <small>ملاحظات: {order.note}</small>}

                {order.delivery_url && (
                  <a href={order.delivery_url}
                     target="_blank"
                     rel="noreferrer">
                    رابط التسليم الحالي
                  </a>
                )}
              </div>

              <div className="admin-actions">
                <button onClick={() => viewProof(order.proof_path)}>
                  عرض الإيصال
                </button>

                <button onClick={() => changeStatus(order.id, 'approved')}>
                  موافقة
                </button>

                <button onClick={() => changeStatus(order.id, 'rejected')}>
                  رفض
                </button>

                <button onClick={() => setDelivery(order)}>
                  إضافة رابط التسليم
                </button>

                <button onClick={() => changeStatus(order.id, 'delivered')}>
                  تم التسليم
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === 'products' && (
        <section className="admin-table product-admin">
          <h2>إدارة المنتجات والأسعار</h2>
          <p>عدّل السعر الحالي والسعر السابق، وحدد ظهور المنتج في الكتالوج.</p>
          {productMessage && <p className={productMessage.startsWith('تعذر') ? 'error' : 'product-success'} role="status">{productMessage}</p>}
          {productsLoading ? <p>جاري تحميل المنتجات...</p> : products.length === 0 ? <p>لا توجد منتجات في جدول الكتالوج.</p> : products.map(product => (
            <article key={product.id}>
              <div className="product-admin-fields">
                <b>{product.name}</b>
                <small>آخر تحديث: {product.updated_at ? new Date(product.updated_at).toLocaleString('ar-EG') : '—'}</small>
                <label>السعر الحالي (جنيه)<input type="number" min="0" step="0.01" value={product.price ?? ''} onChange={e => setProducts(current => current.map(item => item.id === product.id ? { ...item, price: e.target.value } : item))} /></label>
                <label>السعر السابق (جنيه)<input type="number" min="0" step="0.01" value={product.old_price ?? ''} onChange={e => setProducts(current => current.map(item => item.id === product.id ? { ...item, old_price: e.target.value } : item))} /></label>
                <label className="product-active"><input type="checkbox" checked={Boolean(product.active)} onChange={e => setProducts(current => current.map(item => item.id === product.id ? { ...item, active: e.target.checked } : item))} /> ظاهر في المتجر</label>
                <button disabled={productBusy === product.id} onClick={() => saveProduct(product)}>{productBusy === product.id ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
              </div>
            </article>
          ))}
        </section>
      )}
      {tab === 'feedback' && (
        <section className="admin-table">
          <h2>آراء واقتراحات العملاء</h2>

          {feedback.length === 0 ? (
            <p>لا توجد آراء حتى الآن.</p>
          ) : feedback.map(item => (
            <article key={item.id}>
              <div>
                <b>{item.name || 'عميل بدون اسم'}</b>
                <span>{item.kind}</span>
                <small>حالة الشراء: {item.purchased || 'غير محددة'}</small>
                <p>{item.message}</p>
                <small>
                  {new Date(item.created_at).toLocaleString('ar-EG')}
                </small>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/order/:id" element={<Order />} />
      <Route path="/track-order" element={<TrackOrder />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

