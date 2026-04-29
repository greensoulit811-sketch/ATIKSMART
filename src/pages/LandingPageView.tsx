// import { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useLandingPage } from '@/hooks/useLandingPages';
// import { useSiteSettings } from '@/contexts/SiteSettingsContext';
// import { useAuth } from '@/hooks/useAuth';
// import { useCreateOrder } from '@/hooks/useOrders';
// import { useShippingMethods } from '@/hooks/useShippingMethods';
// import { usePaymentMethods } from '@/hooks/usePaymentMethods';
// import { useReviews, Product } from '@/hooks/useShopData';
// import { supabase } from '@/integrations/supabase/client';
// import { useQuery } from '@tanstack/react-query';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Skeleton } from '@/components/ui/skeleton';
// import { ShoppingBag, ShieldCheck, Truck, ArrowRight, Zap, Phone, CheckCircle2, ChevronRight, Minus, Plus, Search, User, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
// import { toast } from 'sonner';

// // --- Luxury Minimalist Theme ---

// const AutoImageSlider = ({ images }: { images: string[] }) => {
//   const [index, setIndex] = useState(0);

//   useEffect(() => {
//     if (images.length <= 1) return;
//     const interval = setInterval(() => {
//       setIndex((prev) => (prev + 1) % images.length);
//     }, 3000);
//     return () => clearInterval(interval);
//   }, [images]);

//   if (!images.length) return null;

//   return (
//     <div className="relative w-full h-full overflow-hidden">
//       {images.map((img, i) => (
//         <img
//           key={i}
//           src={img}
//           className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
//           alt={`slide-${i}`}
//         />
//       ))}
//     </div>
//   );
// };

// const useLandingProducts = (ids: string[]) => {
//   return useQuery({
//     queryKey: ['landing_products', ids],
//     queryFn: async () => {
//       if (!ids.length) return [];
//       const { data, error } = await supabase.from('products').select('*').in('id', ids);
//       if (error) throw error;
//       const map = new Map((data || []).map(p => [p.id, p]));
//       return ids.map(id => map.get(id)).filter(Boolean) as Product[];
//     },
//     enabled: ids.length > 0,
//   });
// };

// export default function LandingPageView() {
//   const { slug } = useParams<{ slug: string }>();
//   const navigate = useNavigate();
//   const { data: page, isLoading } = useLandingPage(slug || '');
//   const { formatCurrency, settings } = useSiteSettings();
//   const { user } = useAuth();
//   const createOrder = useCreateOrder();
//   const { data: shippingMethods = [] } = useShippingMethods(true);
//   const { data: paymentMethods = [] } = usePaymentMethods(true);
//   const { data: products = [] } = useLandingProducts(page?.product_ids || []);

//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
//   const [quantity, setQuantity] = useState(1);
//   const accentColor = page?.accent_color || '#000000';

//   const [formData, setFormData] = useState({
//     fullName: '', phone: '', email: '', address: '', city: '', 
//     country: settings?.default_country_name || '', notes: '',
//     shippingMethodId: '', paymentMethodId: '',
//   });
//   const [transactionId, setTransactionId] = useState('');

//   useEffect(() => {
//     if (products.length > 0 && !selectedProduct) setSelectedProduct(products[0]);
//   }, [products]);

//   useEffect(() => {
//     if (shippingMethods.length > 0 && !formData.shippingMethodId) {
//       setFormData(prev => ({ ...prev, shippingMethodId: shippingMethods[0].id }));
//     }
//   }, [shippingMethods]);

//   useEffect(() => {
//     if (paymentMethods.length > 0 && !formData.paymentMethodId) {
//       setFormData(prev => ({ ...prev, paymentMethodId: paymentMethods[0].id }));
//     }
//   }, [paymentMethods]);

//   const selectedShipping = shippingMethods.find(m => m.id === formData.shippingMethodId);
//   const shippingCost = selectedShipping?.base_rate || 0;
//   const effectivePrice = selectedProduct ? (selectedProduct.sale_price ?? selectedProduct.price) : 0;
//   const subtotal = effectivePrice * quantity;
//   const total = subtotal + shippingCost;

//   const selectedPayment = paymentMethods.find(m => m.id === formData.paymentMethodId);
//   const hasPartial = selectedPayment?.allow_partial_delivery_payment || false;
//   let advanceAmount = 0;
//   let dueOnDelivery = total;
//   if (hasPartial && selectedPayment) {
//     if (selectedPayment.partial_type === 'delivery_charge') advanceAmount = shippingCost;
//     else if (selectedPayment.partial_type === 'fixed_amount') advanceAmount = Math.min(selectedPayment.fixed_partial_amount || 0, total);
//     dueOnDelivery = total - advanceAmount;
//   }
//   const requiresTrxId = selectedPayment?.require_transaction_id || false;

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const scrollToCheckout = () => {
//     document.getElementById('lp-checkout')?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedProduct) return;
//     if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
//       toast.error('সবগুলো ঘর পূরণ করুন');
//       return;
//     }
//     if (requiresTrxId && !transactionId.trim()) {
//       toast.error('ট্রানজ্যাকশন আইডি প্রয়োজন');
//       return;
//     }

//     const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
//     try {
//       await createOrder.mutateAsync({
//         order: {
//           order_number: orderNumber, user_id: user?.id || null,
//           customer_name: formData.fullName, customer_phone: formData.phone,
//           customer_email: formData.email || null, shipping_address: formData.address,
//           shipping_city: formData.city, shipping_method: selectedShipping?.name || 'Standard',
//           shipping_cost: shippingCost, payment_method: selectedPayment?.code || 'cod',
//           subtotal, total, status: 'pending', notes: formData.notes || null,
//           payment_method_id: selectedPayment?.id || null,
//           payment_method_name: selectedPayment?.name || 'ক্যাশ অন ডেলিভারি',
//           payment_status: hasPartial ? 'partial_paid' : 'unpaid',
//           paid_amount: advanceAmount, due_amount: dueOnDelivery,
//           transaction_id: transactionId.trim() || null,
//         },
//         items: [{
//           product_id: selectedProduct.id, product_name: selectedProduct.name,
//           product_image: selectedProduct.images?.[0] || '', quantity,
//           price: effectivePrice, variant_id: null, variant_info: null,
//         }],
//       });
//       navigate(`/order-success?orderId=${orderNumber}`);
//     } catch (error) {}
//   };

//   if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
//   if (!page) return <div className="min-h-screen flex items-center justify-center font-serif">Page Not Found</div>;

//   return (
//     <div className="min-h-screen bg-white text-[#1a1a1a] selection:bg-black selection:text-white" style={{ '--accent': accentColor } as React.CSSProperties}>
      
//       {/* --- External Fonts --- */}
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@300;400;600;800&display=swap');
//         .font-serif { font-family: 'Playfair Display', serif; }
//         .font-sans { font-family: 'Inter', sans-serif; }
//         .letter-spacing-huge { letter-spacing: 0.2em; }
//         .no-scrollbar::-webkit-scrollbar { display: none; }
//       `}</style>

//       {/* --- Header --- */}
//       <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100">
//         <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
//            <div className="flex-1 flex gap-6 text-[11px] font-bold uppercase tracking-widest hidden lg:flex">
//               <a href="#" className="hover:opacity-50 transition-opacity">Collections</a>
//               <a href="#" className="hover:opacity-50 transition-opacity">Shop</a>
//               <a href="#" className="hover:opacity-50 transition-opacity">About</a>
//            </div>
           
//            <div className="flex-1 flex justify-center">
//               <span className="text-2xl font-black font-serif uppercase tracking-tight leading-none text-center">
//                 {settings?.site_name?.split(' ').map((word, i) => (
//                   <span key={i} className={i % 2 !== 0 ? 'italic font-normal' : ''}>{word} </span>
//                 ))}
//               </span>
//            </div>

//            <div className="flex-1 flex justify-end items-center gap-6">
//               <button className="hover:scale-110 transition-transform"><Search className="h-5 w-5 stroke-[1.5px]" /></button>
//               <button className="hover:scale-110 transition-transform" onClick={scrollToCheckout}><ShoppingBag className="h-5 w-5 stroke-[1.5px]" /></button>
//               <a href={`tel:${settings?.phone}`} className="lg:flex items-center gap-2 bg-black text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hidden">
//                 <Phone className="h-3 w-3" /> Call Support
//               </a>
//            </div>
//         </div>
//       </header>

//       {/* --- Hero Section (Split Look) --- */}
//       <section className="relative bg-[#f9f9f9]">
//         <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
//            {/* Left Info */}
//            <div className="flex flex-col justify-center px-10 py-20 lg:p-24 space-y-10 order-2 lg:order-1 bg-white">
//               <div className="space-y-4">
//                 <p className="text-[12px] font-bold uppercase tracking-[0.4em] text-gray-400">Shop New Collections</p>
//                 <h1 className="text-5xl lg:text-8xl font-serif font-black uppercase leading-[0.9] tracking-tighter">
//                   Just In:<br />
//                   <span className="italic font-normal">New Shape</span><br />
//                   & Shades
//                 </h1>
//               </div>
              
//               <div className="flex items-center gap-4">
//                  <div className="w-16 h-[1px] bg-black"></div>
//                  <p className="text-sm font-medium text-gray-500 max-w-sm">
//                    {page.hero_subtitle || 'Discover our latest collection of premium eyewear designed for those who value both style and substance.'}
//                  </p>
//               </div>

//               <div className="flex flex-col sm:flex-row gap-4 pt-6">
//                  <Button onClick={scrollToCheckout} className="h-16 px-10 bg-black text-white rounded-none text-xs font-bold uppercase tracking-[0.3em] hover:bg-gray-800 transition-colors">
//                     {page.hero_cta_text}
//                  </Button>
//                  <Button variant="outline" onClick={scrollToCheckout} className="h-16 px-10 border-black rounded-none text-xs font-bold uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all">
//                     View Catalog
//                  </Button>
//               </div>
              
//               {/* Product Sketch Look (as seen in image) */}
//               <div className="pt-12 hidden lg:block opacity-20">
//                  <img src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=200" className="w-24 h-auto grayscale" alt="sketch" />
//               </div>
//            </div>

//            {/* Right Image */}
//            <div className="relative order-1 lg:order-2 overflow-hidden h-[50vh] lg:h-auto">
//               <img src={page.hero_image || 'https://images.unsplash.com/photo-1511499767350-a1590fdb7307?auto=format&fit=crop&q=80'} className="w-full h-full object-cover" alt="hero" />
//               <div className="absolute inset-0 bg-black/5"></div>
//               <div className="absolute bottom-10 left-10 text-white space-y-2">
//                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Featured Look</p>
//                  <h2 className="text-2xl font-serif italic">The Vintage Green</h2>
//               </div>
//            </div>
//         </div>
//       </section>

//       {/* --- Best Sellers Grid --- */}
//       <section className="py-24 px-6 max-w-[1400px] mx-auto space-y-16">
//         <div className="text-center space-y-4">
//            <h2 className="text-3xl lg:text-5xl font-serif font-black uppercase tracking-tighter italic">Best Sellers</h2>
//            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">The most loved pieces</p>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
//            {products.map((p) => (
//              <div key={p.id} className="group cursor-pointer space-y-6" onClick={() => { setSelectedProduct(p); scrollToCheckout(); }}>
//                 <div className="aspect-[3/4] bg-[#fbfbfb] overflow-hidden relative border border-gray-50">
//                    <img src={p.images?.[0]} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-110" alt={p.name} />
//                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
//                    {p.sale_price && (
//                       <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest bg-white px-2 py-1">Limited</div>
//                    )}
//                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
//                       <Button className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-4 py-2 h-auto rounded-none">Quick View</Button>
//                    </div>
//                 </div>
//                 <div className="space-y-1 text-center">
//                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 leading-none">{p.name}</h3>
//                    <p className="text-sm font-serif font-bold italic">{formatCurrency(p.sale_price ?? p.price)}</p>
//                 </div>
//              </div>
//            ))}
//         </div>
        
//         <div className="text-center pt-8">
//            <button className="text-[11px] font-black uppercase tracking-[0.4em] border-b-2 border-black pb-2 hover:opacity-50 transition-opacity">View All Best Sellers</button>
//         </div>
//       </section>

//       {/* --- Dynamic Celebrities Section --- */}
//       <section className="py-32 bg-[#111] text-white">
//         <div className="max-w-[1400px] mx-auto px-6">
//            <div className="text-center space-y-4 mb-24">
//               <h2 className="text-5xl lg:text-7xl font-serif font-black uppercase italic tracking-tighter">Celebrities</h2>
//               <p className="text-[11px] font-bold uppercase tracking-[0.6em] text-white/40 italic">Get the Look</p>
//            </div>

//            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 px-0">
//               {(page.features && page.features.length > 0 ? page.features : [
//                 { title: 'Cristiano', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800' },
//                 { title: 'Benedict', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800' },
//                 { title: 'William', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800' }
//               ]).slice(0, 3).map((feat: any, i: number) => (
//                 <div key={i} className="group relative aspect-[4/5] overflow-hidden bg-zinc-900 cursor-none">
//                    <img src={feat.image} className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110 grayscale hover:grayscale-0 opacity-60 group-hover:opacity-100" alt={feat.title} />
//                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
//                    <div className="absolute bottom-10 left-10 space-y-3">
//                       <div className="w-8 h-[1px] bg-white/40 group-hover:w-16 transition-all duration-700"></div>
//                       <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/70 group-hover:text-white transition-colors">{feat.title}</h4>
//                    </div>
//                 </div>
//               ))}
//            </div>
//         </div>
//       </section>

//       {/* --- Limited Edition / Lifestyle --- */}
//       <section className="py-24 px-6 max-w-[1400px] mx-auto space-y-16">
//         <div className="text-center space-y-4">
//            <h2 className="text-3xl lg:text-5xl font-serif font-black uppercase tracking-tighter italic">Limited Edition</h2>
//            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">for a short time</p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//            {(page.how_to_use_cards.length > 0 ? page.how_to_use_cards.slice(0, 3) : [
//              { image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&q=80', title: 'Exclusive Series 01' },
//              { image: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?auto=format&fit=crop&q=80', title: 'Exclusive Series 02' },
//              { image: 'https://images.unsplash.com/photo-1577733966973-d680bfee2e99?auto=format&fit=crop&q=80', title: 'Exclusive Series 03' }
//            ]).map((c, i) => (
//              <div key={i} className="space-y-6 group">
//                 <div className="aspect-[3/4] overflow-hidden relative">
//                    <img src={c.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="limited" />
//                 </div>
//                 <div className="text-center">
//                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">{c.title}</p>
//                 </div>
//              </div>
//            ))}
//         </div>
//       </section>

//       {/* --- Reimagined Luxury Product Showcase (Precision Section) --- */}
//       <section className="py-32 px-6 bg-white overflow-hidden relative border-t border-gray-100">
//         {/* Background Decorative Number */}
//         <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 text-[30rem] lg:text-[40rem] font-serif font-black text-black/[0.02] leading-none select-none pointer-events-none">
//           01
//         </div>

//         <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
//           <div className="space-y-16">
//             <div className="space-y-8">
//               <span className="text-[11px] font-black uppercase tracking-[0.6em] text-gray-400 block">
//                 Handcrafted Excellence
//               </span>
//               <h2 className="text-6xl lg:text-8xl font-serif font-black uppercase italic tracking-tighter leading-[0.9] text-black">
//                 Precision In<br />Every Detail
//               </h2>
//               <div className="w-20 h-[1px] bg-black/10"></div>
//               <p className="max-w-md text-sm text-gray-500 leading-relaxed font-medium">
//                 Each piece is meticulously crafted by artisans using the finest materials and centuries-old techniques. Built to last a lifetime and beyond.
//               </p>
//             </div>

//             <div className="grid grid-cols-2 gap-12">
//               <div className="space-y-4">
//                 <div className="flex items-baseline gap-2">
//                   <span className="text-5xl font-serif font-bold italic">100%</span>
//                 </div>
//                 <div className="w-8 h-[1px] bg-black/20"></div>
//                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Purity & Quality<br />Guaranteed</p>
//               </div>
//               <div className="space-y-4">
//                 <div className="flex items-baseline gap-2">
//                   <span className="text-5xl font-serif font-bold italic">Hand</span>
//                 </div>
//                 <div className="w-8 h-[1px] bg-black/20"></div>
//                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Crafted with<br />Authenticity</p>
//               </div>
//             </div>

//             <div className="pt-8">
//                <Button onClick={scrollToCheckout} className="group h-20 px-16 bg-black text-white rounded-none text-xs font-bold uppercase tracking-[0.5em] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all overflow-hidden relative">
//                   <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
//                   <span className="relative z-10">Shop The Collection</span>
//                </Button>
//             </div>
//           </div>

//           <div className="relative group">
//             {/* Decorative Frame Elements */}
//             <div className="absolute -inset-10 border border-black/[0.03] -z-10 group-hover:inset-0 transition-all duration-1000"></div>
//             <div className="absolute -top-6 -right-6 w-24 h-24 border-t-2 border-r-2 border-black/5"></div>
//             <div className="absolute -bottom-6 -left-6 w-24 h-24 border-b-2 border-l-2 border-black/5"></div>
            
//             <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] transition-transform duration-1000 group-hover:scale-[1.02]">
//                <AutoImageSlider images={selectedProduct?.images || [page.hero_image || '']} />
//                <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
               
//                {/* Overlay Info */}
//                <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
//                   <div className="space-y-2">
//                     <div className="w-12 h-[2px] bg-black"></div>
//                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white mix-blend-difference">Premium Edition</span>
//                   </div>
//                   <div className="flex gap-1.5">
//                     <div className="w-2 h-2 rounded-full bg-black"></div>
//                     <div className="w-2 h-2 rounded-full bg-black/20"></div>
//                     <div className="w-2 h-2 rounded-full bg-black/20"></div>
//                   </div>
//                </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* --- Reimagined Luxury Checkout Section with Premium BG --- */}
//       <section id="lp-checkout" className="py-32 px-6 bg-[#f8f5f2] border-t border-gray-100 relative overflow-hidden">
//         {/* Background Decorative Elements */}
//         <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-40">
//            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/[0.015] rounded-full blur-[120px]"></div>
//            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/[0.015] rounded-full blur-[120px]"></div>
//            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-black/[0.03]"></div>
//            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-full bg-black/[0.03]"></div>
//         </div>

//         <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
           
//            {/* Order Summary (Sticky Sidebar) */}
//            <div className="lg:col-span-5 lg:sticky lg:top-2">
//               {selectedProduct && (
//                 <div className="bg-white p-10 lg:p-12 border border-gray-100 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.1)] space-y-10 relative overflow-hidden group">
//                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-black/[0.02] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                   
//                    <div className="relative flex gap-10 items-center">
//                       <div className="w-36 aspect-square bg-gray-50 border border-gray-100 p-4 transition-transform group-hover:-rotate-3 duration-500">
//                          <img src={selectedProduct.images?.[0]} className="w-full h-full object-contain mix-blend-multiply" alt={selectedProduct.name} />
//                       </div>
//                       <div className="flex-1 space-y-4">
//                          <h5 className="font-serif text-3xl font-bold uppercase italic tracking-tight leading-tight">{selectedProduct.name}</h5>
//                          <div className="flex items-center gap-8">
//                             <span className="font-sans font-black text-3xl">{formatCurrency(effectivePrice)}</span>
//                             <div className="flex items-center gap-8 bg-gray-50 border border-gray-100 px-5 py-2">
//                                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="hover:opacity-30 transition-opacity"><Minus className="h-4 w-4" /></button>
//                                <span className="font-bold text-lg w-6 text-center">{quantity}</span>
//                                <button type="button" onClick={() => setQuantity(quantity + 1)} className="hover:opacity-30 transition-opacity"><Plus className="h-4 w-4" /></button>
//                             </div>
//                          </div>
//                       </div>
//                    </div>
                   
//                    <div className="relative space-y-6 pt-12 border-t border-gray-100">
//                       <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400"><span>সাবটোটাল</span><span className="text-black">{formatCurrency(subtotal)}</span></div>
//                       <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400"><span>শিপিং চার্জ</span><span className="text-black">{formatCurrency(shippingCost)}</span></div>
//                       <div className="flex justify-between items-center pt-10 border-t-2 border-red-500">
//                          <span className="text-2xl lg:text-3xl font-serif font-black uppercase italic tracking-tighter">সর্বমোট</span>
//                          <span className="text-5xl font-sans font-black text-red-600">{formatCurrency(total)}</span>
//                       </div>
//                    </div>

//                    <div className="relative grid grid-cols-2 gap-6 pt-10 border-t border-gray-100 border-dashed">
//                       <div className="flex items-center gap-4">
//                         <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-black/60"><Truck className="h-4 w-4" /></div>
//                         <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Insured Delivery</span>
//                       </div>
//                       <div className="flex items-center gap-4">
//                         <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-black/60"><ShieldCheck className="h-4 w-4" /></div>
//                         <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Safe Transaction</span>
//                       </div>
//                    </div>
//                 </div>
//               )}
//            </div>

//            {/* Checkout Form (Luxury Side-by-Side) */}
//            <div className="lg:col-span-7 bg-white p-8 lg:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
//               <form onSubmit={handleSubmit} className="space-y-12">
                 
//                  {/* Step 1: Contact Info */}
//                  <div className="space-y-8">
//                     <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
//                        <div className="w-2 h-6 bg-black"></div>
//                        <h3 className="text-xl font-bold font-serif italic tracking-tight">যোগাযোগের তথ্য</h3>
//                     </div>
//                     <div className="grid grid-cols-1 gap-6">
//                        <div className="space-y-2">
//                           <label className="text-xs font-bold text-gray-500">পূর্ণ নাম *</label>
//                           <Input name="fullName" value={formData.fullName} onChange={handleChange} required className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:border-black transition-all" placeholder="আপনার নাম লিখুন" />
//                        </div>
//                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                           <div className="space-y-2">
//                              <label className="text-xs font-bold text-gray-500">ফোন নম্বর *</label>
//                              <Input name="phone" value={formData.phone} onChange={handleChange} required className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:border-black transition-all" placeholder="আপনার ফোন নম্বর" />
//                           </div>
//                           <div className="space-y-2">
//                              <label className="text-xs font-bold text-gray-500">ইমেইল (ঐচ্ছিক)</label>
//                              <Input name="email" type="email" className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:border-black transition-all" placeholder="আপনার ইমেইল" />
//                           </div>
//                        </div>
//                     </div>
//                  </div>

//                  {/* Step 2: Shipping Info */}
//                  <div className="space-y-8">
//                     <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
//                        <div className="w-2 h-6 bg-black"></div>
//                        <h3 className="text-xl font-bold font-serif italic tracking-tight">শিপিং ঠিকানা</h3>
//                     </div>
//                     <div className="space-y-6">
//                        <div className="space-y-2">
//                           <label className="text-xs font-bold text-gray-500">শহর *</label>
//                           <Input name="city" value={formData.city} onChange={handleChange} required className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:border-black transition-all" placeholder="আপনার শহর" />
//                        </div>
//                        <div className="space-y-2">
//                           <label className="text-xs font-bold text-gray-500">পূর্ণ ঠিকানা *</label>
//                           <Input name="address" value={formData.address} onChange={handleChange} required className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:border-black transition-all" placeholder="আপনার পূর্ণ ঠিকানা (বাসা নং, রোড নং, এলাকা)" />
//                        </div>
//                        <div className="space-y-2">
//                           <label className="text-xs font-bold text-gray-500">অর্ডার নোট (ঐচ্ছিক)</label>
//                           <textarea className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-black transition-all resize-none outline-none text-sm" placeholder="অর্ডার সংক্রান্ত কোনো তথ্য থাকলে এখানে লিখুন"></textarea>
//                        </div>
//                     </div>
//                  </div>

//                  {/* Step 3: Logistics & Payment */}
//                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
//                     <div className="space-y-6">
//                        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
//                           <h3 className="text-sm font-bold tracking-tight">শিপিং পদ্ধতি</h3>
//                        </div>
//                        <div className="space-y-3">
//                           {shippingMethods.map(m => (
//                             <label key={m.id} className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${formData.shippingMethodId === m.id ? 'border-red-500 bg-red-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
//                                <div className="flex items-center gap-3">
//                                   <input type="radio" name="shippingMethodId" value={m.id} checked={formData.shippingMethodId === m.id} onChange={handleChange} className="accent-red-500" />
//                                   <span className="text-xs font-bold text-gray-700">{m.name}</span>
//                                </div>
//                                <span className="text-xs font-black text-red-600">{formatCurrency(m.base_rate)}</span>
//                             </label>
//                           ))}
//                        </div>
//                     </div>
//                     <div className="space-y-6">
//                        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
//                           <h3 className="text-sm font-bold tracking-tight">পেমেন্ট পদ্ধতি</h3>
//                        </div>
//                        <div className="space-y-3">
//                           {paymentMethods.map(pm => (
//                             <div key={pm.id} className="space-y-3">
//                                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${formData.paymentMethodId === pm.id ? 'border-red-500 bg-red-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
//                                   <input type="radio" name="paymentMethodId" value={pm.id} checked={formData.paymentMethodId === pm.id} onChange={handleChange} className="accent-red-500" />
//                                   <span className="text-xs font-bold text-gray-700">{pm.name}</span>
//                                </label>
//                                {formData.paymentMethodId === pm.id && requiresTrxId && (
//                                  <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="ট্রানজেকশন আইডি দিন" className="h-12 border-2 border-red-500 text-xs font-bold" />
//                                )}
//                             </div>
//                           ))}
//                        </div>
//                     </div>
//                  </div>

//                  {/* Confirmation Button */}
//                  <div className="pt-6">
//                     <Button type="submit" className="w-full h-16 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-lg transition-all shadow-xl shadow-red-200 group active:scale-95" disabled={createOrder.isPending || !selectedProduct}>
//                        <span className="flex items-center justify-center gap-3">
//                           {createOrder.isPending ? 'অর্ডার প্রসেস হচ্ছে...' : 'অর্ডার সম্পন্ন করুন'}
//                           <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
//                        </span>
//                     </Button>
//                  </div>
//               </form>
//            </div>

//         </div>
//       </section>





//       {/* --- Minimalist Footer (Exact Match to Image) --- */}
//       <footer className="py-20 px-6 bg-white border-t border-gray-100">
//          <div className="max-w-[1400px] mx-auto space-y-12">
//             {/* Top: Brand & Menu */}
//             <div className="flex flex-col items-center space-y-8">
//                <span className="text-3xl font-serif font-black uppercase tracking-tighter italic">
//                  {settings?.site_name}
//                </span>
//                <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
//                   <a href="#" className="text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-50 transition-opacity">Collection</a>
//                   <a href="#" className="text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-50 transition-opacity">Celebrities</a>
//                   <a href="#" className="text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-50 transition-opacity">Best Seller</a>
//                   <a href="#" className="text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-50 transition-opacity">Shop</a>
//                </nav>
//             </div>
            
//             {/* Bottom Bar */}
//             <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
//                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
//                   © {new Date().getFullYear()} {settings?.site_name} - ALL RIGHTS RESERVED.
//                </p>
//                <div className="flex items-center gap-6">
//                   <a href="#" className="hover:scale-110 transition-transform"><Facebook className="h-4 w-4 stroke-[1.5px]" /></a>
//                   <a href="#" className="hover:scale-110 transition-transform"><Instagram className="h-4 w-4 stroke-[1.5px]" /></a>
//                   <a href="#" className="hover:scale-110 transition-transform"><Twitter className="h-4 w-4 stroke-[1.5px]" /></a>
//                   <a href="#" className="hover:scale-110 transition-transform"><Youtube className="h-4 w-4 stroke-[1.5px]" /></a>
//                </div>
//             </div>
//          </div>
//       </footer>

//     </div>
//   );
// }



import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLandingPage } from '@/hooks/useLandingPages';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { useCreateOrder } from '@/hooks/useOrders';
import { useShippingMethods } from '@/hooks/useShippingMethods';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useReviews, Product } from '@/hooks/useShopData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, ShieldCheck, Truck, ArrowRight, Zap, Phone, CheckCircle2, ChevronRight, Minus, Plus, Search, User, Facebook, Instagram, Twitter, Youtube, Timer } from 'lucide-react';
import { toast } from 'sonner';

// --- Luxury Minimalist Theme ---

const AutoImageSlider = ({ images }: { images: string[] }) => {
   const [index, setIndex] = useState(0);

   useEffect(() => {
      setIndex(0); // Reset index when images change
   }, [images.length]);

   useEffect(() => {
      if (!images || images.length <= 1) return;
      const interval = setInterval(() => {
         setIndex((prev) => (prev + 1) % images.length);
      }, 3000);
      return () => clearInterval(interval);
   }, [images.length]); // Depend on length to avoid reset on every render if reference changes

   if (!images.length) return null;

   return (
      <div className="relative w-full h-full overflow-hidden">
         {images.map((img, i) => (
            <img
               key={i}
               src={img}
               className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
               alt={`slide-${i}`}
            />
         ))}
      </div>
   );
};

const useLandingProducts = (ids: string[]) => {
   return useQuery({
      queryKey: ['landing_products', ids],
      queryFn: async () => {
         if (!ids.length) return [];
         const { data, error } = await supabase.from('products').select('*').in('id', ids);
         if (error) throw error;
         const map = new Map((data || []).map(p => [p.id, p]));
         return ids.map(id => map.get(id)).filter(Boolean) as Product[];
      },
      enabled: ids.length > 0,
   });
};

export default function LandingPageView() {
   const { slug: paramSlug } = useParams<{ slug: string }>();
   const navigate = useNavigate();
   
   // Fetch all landing pages to find the first one if no slug is provided
   const { data: allPages, isLoading: isPagesLoading } = useQuery({
      queryKey: ['landing_pages_list'],
      queryFn: async () => {
         const { data, error } = await supabase.from('landing_pages').select('slug').limit(1);
         if (error) throw error;
         return data;
      },
      enabled: !paramSlug
   });

   const slug = paramSlug || allPages?.[0]?.slug || '';
   const { data: page, isLoading: isPageLoading } = useLandingPage(slug);
   
   // Fix: Only consider it loading if we are actually fetching data
   const isLoading = (isPagesLoading && !paramSlug) || (isPageLoading && !!slug);

   const displayPage = {
      title: 'Power Honey',
      slug: 'default',
      hero_title: 'Power Honey',
      hero_image: 'https://images.unsplash.com/photo-1511499767350-a1590fdb7307?auto=format&fit=crop&q=',
      hero_cta_text: 'অর্ডার করতে চাই',
      product_ids: [],
      benefits: [],
      section2_images: [],
      features: [],
      how_to_use_cards: [],
      trust_badges: [],
      section6_packages: [],
      section6_show_sticky_bar: true,
      section6_sticky_text: 'সারা বাংলাদেশে ফ্রি ডেলিভারি!',
      section6_sticky_countdown: '01:10:37'
   } as any;

   const pageToRender = page ? { ...displayPage, ...page } : displayPage;

   const { formatCurrency, settings } = useSiteSettings();
   const { user } = useAuth();
   const createOrder = useCreateOrder();
   const { data: shippingMethods = [] } = useShippingMethods(true);
   const { data: paymentMethods = [] } = usePaymentMethods(true);
   const { data: products = [] } = useLandingProducts(pageToRender?.product_ids || []);

   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
   const [quantity, setQuantity] = useState(1);
   const accentColor = pageToRender?.accent_color || '#000000';

   const [formData, setFormData] = useState({
      fullName: '', phone: '', email: '', address: '', city: '',
      country: settings?.default_country_name || '', notes: '',
      shippingMethodId: '', paymentMethodId: '',
   });
   const [transactionId, setTransactionId] = useState('');

   useEffect(() => {
      if (products.length > 0 && !selectedProduct) setSelectedProduct(products[0]);
   }, [products]);

   useEffect(() => {
      if (shippingMethods.length > 0 && !formData.shippingMethodId) {
         setFormData(prev => ({ ...prev, shippingMethodId: shippingMethods[0].id }));
      }
   }, [shippingMethods]);

   useEffect(() => {
      if (paymentMethods.length > 0 && !formData.paymentMethodId) {
         setFormData(prev => ({ ...prev, paymentMethodId: paymentMethods[0].id }));
      }
   }, [paymentMethods]);

   const selectedShipping = shippingMethods.find(m => m.id === formData.shippingMethodId);
   const shippingCost = selectedShipping?.base_rate || 0;
   const effectivePrice = selectedProduct ? (selectedProduct.sale_price ?? selectedProduct.price) : 0;
   const subtotal = effectivePrice * quantity;
   const total = subtotal + shippingCost;

   const selectedPayment = paymentMethods.find(m => m.id === formData.paymentMethodId);
   const hasPartial = selectedPayment?.allow_partial_delivery_payment || false;
   let advanceAmount = 0;
   let dueOnDelivery = total;
   if (hasPartial && selectedPayment) {
      if (selectedPayment.partial_type === 'delivery_charge') advanceAmount = shippingCost;
      else if (selectedPayment.partial_type === 'fixed_amount') advanceAmount = Math.min(selectedPayment.fixed_partial_amount || 0, total);
      dueOnDelivery = total - advanceAmount;
   }
   const requiresTrxId = selectedPayment?.require_transaction_id || false;

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
   };

   const scrollToCheckout = () => {
      document.getElementById('lp-checkout')?.scrollIntoView({ behavior: 'smooth' });
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProduct) {
         toast.error('প্যাকেজ সিলেক্ট করুন');
         return;
      }
      if (!formData.fullName || !formData.phone || !formData.address) {
         toast.error('সবগুলো ঘর পূরণ করুন');
         return;
      }
      if (requiresTrxId && !transactionId.trim()) {
         toast.error('ট্রানজ্যাকশন আইডি প্রয়োজন');
         return;
      }

      const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
      // Find a real product ID to satisfy UUID requirement if using a custom package
      const realProductId = selectedProduct.id.startsWith('pkg-') ? products[0]?.id : selectedProduct.id;
      
      try {
         await createOrder.mutateAsync({
            order: {
               order_number: orderNumber, user_id: user?.id || null,
               customer_name: formData.fullName, customer_phone: formData.phone,
               customer_email: formData.email || null, shipping_address: formData.address,
               shipping_city: formData.city || 'N/A', shipping_method: selectedShipping?.name || 'Standard',
               shipping_cost: shippingCost, payment_method: selectedPayment?.code || 'cod',
               subtotal, total, status: 'pending', notes: formData.notes || null,
               payment_method_id: selectedPayment?.id || null,
               payment_method_name: selectedPayment?.name || 'ক্যাশ অন ডেলিভারি',
               payment_status: hasPartial ? 'partial_paid' : 'unpaid',
               paid_amount: advanceAmount, due_amount: dueOnDelivery,
               transaction_id: transactionId.trim() || null,
            },
            items: [{
               product_id: realProductId, product_name: selectedProduct.name,
               product_image: selectedProduct.image || selectedProduct.images?.[0] || '', quantity,
               price: effectivePrice, variant_id: null, variant_info: null,
            }],
         });
         navigate(`/order-success?orderId=${orderNumber}`, { 
            state: { 
               total, 
               currency: settings?.currency_code || 'BDT', 
               items: [{ id: realProductId, quantity, price: effectivePrice }],
               customer_phone: formData.phone,
               customer_email: formData.email
            } 
         });
      } catch (error) { }
   };

   if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
   
   // If no page is found and no slug was provided, we can show a default view or a message
   // But if a slug WAS provided and not found, it's a 404
   if (!page && paramSlug) return <div className="min-h-screen flex items-center justify-center font-serif">Page Not Found</div>;

   return (
      <div className="min-h-screen bg-white text-[#1a1a1a] selection:bg-black selection:text-white" style={{ '--accent': accentColor } as React.CSSProperties}>

         {/* --- External Fonts --- */}
         <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@300;400;600;800&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .letter-spacing-huge { letter-spacing: 0.2em; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        @keyframes float {
           0%, 100% { transform: translateY(0px); }
           50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        @keyframes shimmer {
           0% { left: -100%; }
           100% { left: 100%; }
        }
        .shimmer-btn {
           position: relative;
           overflow: hidden;
         }
         .shimmer-btn::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(
               to right,
               transparent,
               rgba(255, 255, 255, 0.3),
               transparent
            );
            transform: skewX(-25deg);
            animation: shimmer 3s infinite;
         }
         @keyframes pop {
            0% { transform: scale(0.8); opacity: 0; }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
         }
         .animate-pop { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

         {/* --- Header --- */}
         {/* --- Hero Section (Single Image) --- */}
         <section className="w-full bg-white">
            <img
               src={pageToRender.hero_image || 'https://images.unsplash.com/photo-1511499767350-a1590fdb7307?auto=format&fit=crop&q=80'}
               className="w-full h-auto block"
               alt="Hero Banner"
            />
         </section>

         {/* --- Refined Premium Product Showcase (2nd Section) --- */}
         <section className="py-8 lg:py-32 px-4 bg-[#fffaf5] relative overflow-hidden">
            {/* Subtle Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-50/30 to-transparent pointer-events-none"></div>
            
            <div className="max-w-[1200px] mx-auto relative z-10">
               <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                  
                  {/* Left: Content Section */}
                  <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-6">
                     <div className="inline-block px-4 py-1.5 bg-[#fef3c7] text-[#92400e] text-[10px] font-black uppercase tracking-[0.2em] rounded-md shadow-sm border border-[#fcd34d]/30">
                        {pageToRender.section2_badge || 'Premium Formula'}
                     </div>

                     <div className="space-y-5">
                        <h2 className="text-2xl lg:text-6xl font-serif font-black text-[#451a03] leading-[1.6] tracking-tight whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: pageToRender.section2_title || 'শারীরিক দুর্বলতা দূর করে<br /><span class="text-orange-600 italic">ফিরে পান হারানো শক্তি!</span>' }}>
                        </h2>
                        <div className="w-20 h-1 bg-orange-600 mx-auto lg:mx-0 rounded-full"></div>
                        <p className="text-base lg:text-xl text-[#78350f] leading-relaxed font-medium">
                           {pageToRender.section2_subtitle || 'Power Honey হলো বিশেষভাবে তৈরি একটি হারবাল হানি, যা ১২ বোতল ফুল কোর্স হিসেবে উপলব্ধ।'}
                        </p>
                     </div>

                     <div className="flex items-center gap-4 -py-4">
                        <div className="flex text-orange-400">
                           {[1, 2, 3, 4, 5].map((s) => <span key={s} className="text-xl">★</span>)}
                        </div>
                        <div className="py-1 px-2 lg:px-4 bg-white border border-orange-100 rounded-full text-[10px] font-bold text-gray-600 shadow-sm flex items-center gap-2">
                           Trusted by 2500+ Customers
                        </div>
                     </div>
                  </div>

                  {/* Right: Image Section */}
                  <div className="relative group w-full max-w-md mx-auto lg:max-w-none animate-float">
                     <div className="relative aspect-square overflow-hidden rounded-2xl shadow-2xl transition-all duration-700 group-hover:scale-[1.02] border-[10px] border-white bg-white">
                        <AutoImageSlider 
                           images={
                              pageToRender.section2_images && pageToRender.section2_images.length > 0 
                                 ? pageToRender.section2_images 
                                 : (selectedProduct?.images && selectedProduct.images.length > 0 
                                    ? selectedProduct.images 
                                    : [pageToRender.section2_image || pageToRender.hero_image || 'https://images.unsplash.com/photo-1511499767350-a1590fdb7307?auto=format&fit=crop&q=80'])
                           } 
                        />
                        {/* Elegant Glass Overlay */}
                        {/* <div className="absolute bottom-6 left-6 right-6 z-20">
                           <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
                              <p className="text-white font-bold text-xl lg:text-2xl leading-tight whitespace-pre-wrap">
                                 {pageToRender.section2_overlay_text || 'বীর্য/পাত ভয়\nআর নয়'}
                              </p>
                              <div className="mt-3 flex items-center gap-2">
                                 <div className="w-8 h-0.5 bg-orange-500 rounded-full"></div>
                                 <Zap className="h-4 w-4 text-orange-400 fill-orange-400" />
                              </div>
                           </div>
                        </div> */}
                     </div>
                     {/* Decorative background glow (Very subtle) */}
                     <div className="absolute -z-10 -top-6 -left-6 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-40"></div>
                     <div className="absolute -z-10 -bottom-6 -right-6 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-20"></div>
                  </div>

                  {/* Bottom: CTA Buttons */}
                  <div className="w-full lg:col-span-2 flex flex-col sm:flex-row items-center justify-center gap-4 -pt-10 lg:pt-0">
                     <Button 
                        onClick={scrollToCheckout} 
                        className="shimmer-btn w-full max-w-[380px] min-h-[3.5rem] bg-[#c2410c] hover:bg-[#a6340a] text-white rounded-lg text-lg font-black transition-all flex items-center justify-center gap-3 group shadow-xl shadow-orange-900/10"
                     >
                        {pageToRender.section2_cta_text || 'অর্ডার করতে চাই'}
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                     </Button>
                     
                     <a 
                        href={`tel:${settings?.phone}`} 
                        className="w-full max-w-[380px] min-h-[3.5rem] border-2 border-[#ea580c] text-[#ea580c] hover:bg-orange-50 rounded-lg text-lg font-bold flex items-center justify-center gap-3 transition-colors"
                     >
                        <Phone className="h-5 w-5" />
                        {pageToRender.section2_phone_text || 'সরাসরি কল করুন'}
                     </a>
                  </div>
               </div>
            </div>
         </section>

         {/* --- Effectiveness & Benefits (3rd Section) --- */}
         <section className="py-8 sm:py-24 px-4 bg-[#0a0a0a] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-900/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="max-w-[1000px] mx-auto relative z-10 space-y-20">
               <div className="text-center space-y-8">
                  <div className="inline-block px-5 py-2 bg-gradient-to-r from-orange-600/20 to-orange-900/20 text-orange-400 text-[10px] font-black uppercase tracking-[0.25em] rounded-full border border-orange-600/30 backdrop-blur-sm">
                     {pageToRender.section3_badge || 'উপকারিতা'}
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-7xl font-serif font-black uppercase tracking-tight leading-[1.1] px-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                     {pageToRender.section3_title || 'এর কার্যকারিতা ও উপকারিতা'}
                  </h2>
               </div>

               <div className="grid grid-cols-1 gap-3 -py-8">
                  {(pageToRender.benefits && pageToRender.benefits.length > 0 ? pageToRender.benefits : [
                     { text: 'বিশেষ মুহূর্তে দুর্বলতা চিরতরে দূর করে এবং স্ত্রীর কাছে আপনাকে করে তোলে সেরা পুরুষ।' },
                     { text: 'পুরুষত্ব ধরে রাখে এবং শারীরিক শক্তি বাড়ায়।' },
                     { text: 'কাজের মধ্যে মনোযোগ বৃদ্ধি করে, ক্লান্তি দূর করে এবং হারানো শক্তি ফিরিয়ে আনে।' },
                     { text: 'শতভাগ খাঁটি মধু ও প্রাকৃতিক উপাদান, কোনো পার্শ্বপ্রতিক্রিয়া নেই।' },
                     { text: 'রক্ত সঞ্চালন ত্বরান্বিত করে, আকাঙ্ক্ষা বৃদ্ধি করে এবং মানসিক মুডকে প্রফুল্ল রাখে।' }
                  ]).map((benefit, i) => (
                     <div key={i} className="group relative p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md transition-all duration-500 hover:bg-white/[0.06] hover:border-orange-600/30 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                           <p className="text-lg sm:text-xl lg:text-2xl font-medium text-zinc-300 leading-relaxed group-hover:text-white transition-colors">
                              {benefit.text}
                           </p>
                        </div>
                     </div>
                  ))}
               </div>

               <div className="text-center">
                  <Button onClick={scrollToCheckout} className="h-14 px-16 w-full max-w-[380px] bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-lg font-black transition-all shadow-[0_20px_40px_-10px_rgba(234,88,12,0.3)] hover:scale-105 active:scale-95">
                     অর্ডার করতে চাই
                  </Button>
               </div>
            </div>
         </section>

         {/* --- Quality Guarantee & Certificate (4th Section) --- */}
         <section className="py-8 sm:py-24 px-6 bg-[#fffaf5] relative overflow-hidden">
            {/* Dot pattern background */}
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

            <div className="max-w-[1000px] mx-auto relative z-10 space-y-12 text-center">
               <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                     <ShieldCheck className="h-6 w-6 text-orange-600" />
                  </div>
               </div>

               <div className="space-y-4">
                  <h2 className="text-2xl sm:text-4xl lg:text-6xl font-serif font-black text-[#a62626] leading-tight tracking-tight px-4">
                     {pageToRender.section4_title || 'ফলাফল না পেলে মূল্য ফেরত দেওয়া হবে!'}
                  </h2>
                  <div className="max-w-2xl mx-auto">
                     <p className="text-sm sm:text-lg lg:text-xl font-bold text-gray-700 leading-relaxed whitespace-pre-wrap px-4">
                        {pageToRender.section4_subtitle || 'সেবনের মাত্র ১ ঘণ্টার মধ্যে প্রাথমিক ফলাফল অনুভব করা যাবে। শরীরের শক্তি ও সহনশীলতা বৃদ্ধি করে, মুড ও আকাঙ্ক্ষা উন্নত করতে সাহায্য করে।'}
                     </p>
                  </div>
               </div>

               {pageToRender.section4_image && (
                  <div className="relative inline-block group">
                     <div className="absolute -inset-4 bg-orange-200/20 blur-2xl rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="relative p-1 bg-[#8c6b4f] rounded-lg shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
                        <div className="bg-white p-1.5 rounded shadow-inner">
                           <img
                              src={pageToRender.section4_image}
                              className="max-w-full h-auto rounded-sm"
                              alt="Certificate"
                           />
                        </div>
                     </div>
                  </div>
               )}

               <div className="-pt-4">
                  <Button onClick={scrollToCheckout} className="h-14 px-12 w-full max-w-[380px] bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-lg font-black transition-all shadow-xl shadow-orange-200 flex items-center justify-center gap-3 mx-auto group">
                     {pageToRender.section4_cta_text || 'অর্ডার করতে চাই'}
                     <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                  </Button>
               </div>
            </div>
         </section>

         {/* --- Full Width Banner (5th Section) --- */}
         {pageToRender.section5_image && (
            <section className="w-full bg-white">
               <img
                  src={pageToRender.section5_image}
                  className="w-full h-auto block"
                  alt="Promotion Banner"
               />
            </section>
         )}

         {/* --- Pricing & Packages (6th Section) --- */}
         <section className="py-12 sm:py-16 px-4 bg-gradient-to-b from-[#fff9f2] to-white relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto space-y-12 relative z-10">
               <div className="text-center space-y-3">
                  <h2 className="text-3xl lg:text-4xl font-serif font-black text-[#c2410c] uppercase tracking-tight">
                     {pageToRender.section6_title || 'প্যাকেজ ও প্রাইস'}
                  </h2>
                  <p className="text-sm lg:text-base font-bold text-gray-500">
                     {pageToRender.section6_subtitle || 'আপনার পছন্দের Power Honey প্যাকেজটি বেছে নিন'}
                  </p>
               </div>

               <div className="flex flex-wrap justify-center gap-6 lg:gap-8 pt-4">
                  {(pageToRender.section6_packages && pageToRender.section6_packages.length > 0 ? pageToRender.section6_packages : products.map(p => ({
                     name: p.name,
                     price: p.price,
                     is_best_value: products.indexOf(p) === 1,
                     badge: products.indexOf(p) === 1 ? 'Best Value' : ''
                  }))).map((pkg: any, idx: number) => {
                     // Extract quantity if possible, e.g. "6 Bottle"
                     const nameParts = pkg.name.split(' ');
                     const mainName = nameParts.slice(0, 2).join(' '); // Power Honey
                     const quantity = nameParts.slice(2).join(' '); // 6 Bottle
                     
                     return (
                        <div key={idx} className={`w-full max-w-[300px] sm:max-w-[320px] bg-white rounded-2xl sm:rounded-[32px] p-5 sm:p-8 border-2 transition-all duration-500 hover:shadow-xl flex flex-col items-center text-center space-y-4 sm:space-y-6 relative ${pkg.is_best_value ? 'border-[#ea580c] shadow-lg' : 'border-orange-100/50 shadow-sm'}`}>
                           {pkg.is_best_value && (
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                 <div className="bg-[#ea580c] text-white text-[9px] sm:text-[10px] font-black px-4 sm:px-6 py-1.5 sm:py-2 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap">
                                    {pkg.badge || 'Best Value'}
                                 </div>
                              </div>
                           )}
                           
                           <div className="space-y-0.5 sm:space-y-1">
                              <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide">{mainName || 'Power Honey'}</p>
                              <h4 className="text-xl sm:text-2xl font-black text-[#ea580c]">{quantity || pkg.name}</h4>
                           </div>

                           <div className="flex items-baseline gap-0.5 py-1 sm:py-2 w-full justify-center">
                              <span className="text-3xl sm:text-5xl font-black text-gray-900">{formatCurrency(pkg.price).replace('৳', '')}</span>
                              <span className="text-lg sm:text-2xl font-bold text-gray-900">৳</span>
                           </div>

                           <Button onClick={scrollToCheckout} className="w-full h-11 sm:h-12 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-lg sm:rounded-xl text-base sm:text-lg font-black transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95">
                              অর্ডার করুন
                           </Button>
                        </div>
                     );
                  })}
               </div>
            </div>
         </section>

         {/* --- Offer Banner (Below Pricing) --- */}
         {pageToRender.section6_show_sticky_bar && (
            <div className="w-full bg-gradient-to-r from-[#ea580c] via-[#c2410c] to-[#9a3412] text-white py-8 px-6 shadow-[0_20px_40px_rgba(234,88,12,0.2)] relative z-10">
               <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center shrink-0 shadow-xl">
                        <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-[#ea580c]" />
                     </div>
                     <p className="text-lg sm:text-2xl lg:text-3xl font-black italic uppercase tracking-tight text-center md:text-left">
                        {pageToRender.section6_sticky_text?.split('!')[0]} <span className="text-white">{pageToRender.section6_sticky_text?.includes('!') ? pageToRender.section6_sticky_text.split('!')[1] || 'সীমিত সময়ের জন্য ফ্রি ডেলিভারি!' : 'সীমিত সময়ের জন্য ফ্রি ডেলিভারি!'}</span>
                     </p>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-8 bg-black/10 px-8 py-4 rounded-2xl border border-white/10 backdrop-blur-md">
                     <div className="flex flex-col items-center md:items-start">
                        <span className="text-[11px] font-bold uppercase opacity-70 tracking-widest">অফার শেষ হতে বাকি</span>
                        <div className="flex items-center gap-3 font-mono text-3xl font-black text-yellow-400">
                           <Timer className="h-6 w-6" />
                           <span>{pageToRender.section6_sticky_countdown || '24 Hours Only'}</span>
                        </div>
                     </div>
                     <Button onClick={scrollToCheckout} className="bg-white text-[#ea580c] hover:bg-yellow-50 font-black rounded-lg px-10 py-4 text-lg flex items-center gap-3 shadow-2xl transition-all hover:scale-105 active:scale-95 group">
                        অর্ডার করুন <ShoppingBag className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {/* --- Simplified Luxury Checkout Section (Exact Match to Screenshot) --- */}
         <section id="lp-checkout" className="py-8 sm:py-16 px-4 bg-white relative overflow-hidden">
            <div className="max-w-[800px] mx-auto space-y-12 relative z-10">

               {/* Main Header */}
               <div className="w-full py-6 bg-[#fffaf5] border-2 border-[#ea580c] rounded-2xl text-center shadow-xl shadow-orange-900/[0.03] px-4">
                  <h2 className="text-2xl lg:text-4xl font-serif font-black text-[#451a03] leading-tight">অর্ডার করতে আপনার তথ্য দিয়ে নিচের ফরমটি পূরণ করুন</h2>
               </div>

               {/* Product Selection */}
               <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                     <span className="w-8 h-8 bg-[#ea580c] text-white rounded-full flex items-center justify-center text-sm">1</span>
                     প্যাকেজ সিলেক্ট করুন
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {(pageToRender.section6_packages && pageToRender.section6_packages.length > 0 ? pageToRender.section6_packages : products.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        image: p.images?.[0] || 'https://images.unsplash.com/photo-1589330273594-fade1ee91647?q=80&w=200',
                        is_best_value: products.indexOf(p) === 1,
                        badge: products.indexOf(p) === 1 ? 'Best Price' : ''
                     }))).map((pkg: any, idx: number) => {
                        const isSelected = selectedProduct?.id === (pkg.id || `pkg-${idx}`);
                        return (
                           <div
                              key={idx}
                              onClick={() => {
                                 if (pkg.id) {
                                    const prod = products.find(p => p.id === pkg.id);
                                    if (prod) setSelectedProduct(prod);
                                 } else {
                                    setSelectedProduct({ id: `pkg-${idx}`, name: pkg.name, price: pkg.price } as any);
                                 }
                              }}
                              className={`relative p-3 border-2 rounded-2xl cursor-pointer transition-all duration-300 flex items-center gap-4 ${
                                 isSelected 
                                    ? 'border-[#ea580c] bg-orange-50/80 shadow-[0_10px_20px_-5px_rgba(234,88,12,0.1)] scale-[1.02] ring-1 ring-[#ea580c]/30' 
                                    : 'border-gray-100 hover:border-gray-300 bg-white hover:shadow-md'
                              }`}
                           >
                              <div className={`w-20 h-20 rounded-xl overflow-hidden border transition-colors duration-300 shrink-0 ${isSelected ? 'border-orange-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
                                 <img src={pkg.image || 'https://images.unsplash.com/photo-1589330273594-fade1ee91647?q=80&w=200'} className="w-full h-full object-cover" alt={pkg.name} />
                              </div>
                              <div className="flex-1">
                                 <h5 className={`font-bold text-sm transition-colors ${isSelected ? 'text-[#451a03]' : 'text-gray-700'}`}>{pkg.name}</h5>
                                 <p className={`text-xl font-black transition-colors ${isSelected ? 'text-[#c2410c]' : 'text-[#ea580c]'}`}>{formatCurrency(pkg.price)}</p>
                              </div>

                              {pkg.is_best_value && (
                                 <div className={`absolute top-0 right-0 text-[9px] font-black px-2.5 py-1 rounded-bl-xl rounded-tr-[14px] uppercase tracking-wider transition-all ${isSelected ? 'bg-[#c2410c] text-white' : 'bg-[#ea580c] text-white opacity-90'}`}>
                                    {pkg.badge || 'Best Price'}
                                 </div>
                              )}

                              {isSelected && (
                                 <div className="absolute -top-2 -right-2 bg-[#ea580c] text-white rounded-full p-1.5 shadow-lg border-2 border-white animate-pop">
                                    <CheckCircle2 className="h-4 w-4" />
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* Checkout Form */}
               <div className="space-y-8 bg-[#fffaf5] p-6 lg:p-10 rounded-3xl border border-orange-100 shadow-2xl shadow-orange-900/[0.02]">
                  <h3 className="text-xl lg:text-2xl font-black text-[#451a03] border-b-2 border-orange-200 pb-4 flex items-center gap-3">
                     <span className="w-8 h-8 bg-[#ea580c] text-white rounded-full flex items-center justify-center text-sm">2</span>
                     শিপিং তথ্য প্রদান করুন
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">আপনার নাম লিখুন *</label>
                        <Input name="fullName" value={formData.fullName} onChange={handleChange} required className="h-14 border-gray-200 focus:border-[#ea580c] focus:ring-0 text-lg" placeholder="Shuva" />
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">মোবাইল নম্বর *</label>
                        <Input name="phone" value={formData.phone} onChange={handleChange} required className="h-14 border-gray-200 focus:border-[#ea580c] focus:ring-0 text-lg" placeholder="+8801627118102" />
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">ডেলিভারি ঠিকানা লিখুন *</label>
                        <Input name="address" value={formData.address} onChange={handleChange} required className="h-14 border-gray-200 focus:border-[#ea580c] focus:ring-0 text-lg" placeholder="Dohorgaon Bazar, Baliapara, Rupganj" />
                     </div>

                     <div className="p-6 bg-orange-50/50 rounded-xl space-y-2 border border-orange-100">
                        <p className="font-bold text-gray-800">ক্যাশ অন ডেলিভারি</p>
                        <div className="p-4 bg-[#f8d7c4] rounded-lg text-gray-700 text-sm italic">
                           পণ্যটি হাতে পেয়ে দেখে বুঝে টাকা পেমেন্ট করবেন
                        </div>
                     </div>

                     <Button type="submit" className="w-full h-16 bg-[#c2410c] hover:bg-[#9a3412] text-white text-xl font-black rounded-lg transition-all shadow-xl shadow-orange-100 group active:scale-95" disabled={createOrder.isPending || !selectedProduct}>
                        {createOrder.isPending ? 'অর্ডার প্রসেস হচ্ছে...' : `অর্ডার কনফার্ম করুন ${selectedProduct ? formatCurrency(selectedProduct.price) : ''}`}
                     </Button>
                  </form>

                  <div className="pt-4">
                     <a href={`tel:${settings?.phone}`} className="w-full min-h-[4rem] py-4 px-6 border-2 border-dashed border-[#ea580c] rounded-lg flex flex-col sm:flex-row items-center justify-center gap-4 group hover:bg-orange-50 transition-colors text-center">
                        <span className="text-lg font-bold text-gray-700">সরাসরি অর্ডার করতে কল করুন-</span>
                        <span className="bg-[#ea580c] text-white px-8 py-3 rounded-full font-black text-xl shadow-lg shadow-orange-200">
                           {settings?.phone || '01861-192761'}
                        </span>
                     </a>
                  </div>
               </div>

            </div>
         </section>
         
      </div>
   );
}
