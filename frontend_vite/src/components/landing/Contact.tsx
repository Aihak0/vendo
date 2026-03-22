import { useEffect, useState, type FormEvent } from "react";
import SectionChip from "./SectionChip";
import { useReveal } from "./useReveal";


import { MapPin, Phone, Mail, AlarmClock, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPesan } from "../../services/api";
import { useAlert } from "../../pages/UiElements/Alerts";

const contactItems = [
  { icon: <MapPin className="text-blue-400"/>, label: "Alamat", value: "Jl. Raya Gambirono Jember, Jawa Timur 68154" },
  { icon: <Phone className="text-blue-400"/>, label: "Telepon / WhatsApp", value: "+62 852-3248-0914" },
  { icon: <Mail className="text-blue-400"/>, label: "Email", value: "adeazzzmi@gmail.com" },
  { icon: <AlarmClock className="text-blue-400"/>, label: "Jam Operasional Tim", value: "Senin – Sabtu, 08.00 – 15.00 WIB" },
];

export default function Contact() {
  const { ref: leftRef, visible: leftVisible } = useReveal();
  const { ref: rightRef, visible: rightVisible } = useReveal();
  const [isLoading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", need: "", message: "" });
  const [email, setEmail] = useState<string | null>(null);
  const [noTelp, setNoTelp] = useState<string | null>(null);
  const alert = useAlert();
  const [errors, setErrors] = useState({ name: "", contact: "", message: "" });
  const [isFormValid, setIsFormValid] = useState(false);

  const validateForm = () => {
    let newErrors = {
      name: "",
      contact: "",
      message: "",

    };

    // Validasi Nama
    if (form.name && form.name.length < 3) {
      newErrors.name = "Nama minimal harus 3 karakter.";
    }

    // Validasi Pesan
    if (form.message && form.message.length < 10) {
      newErrors.message = "Pesan minimal 10 karakter.";
    }

    // Validasi Contact (Email atau No HP)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(^\+62|62|^08)(\d{3,4}-?){2}\d{3,4}$/;
    
    if (form.contact && !emailRegex.test(form.contact) && !phoneRegex.test(form.contact)) {
      newErrors.contact = "Masukkan Email atau Nomor HP yang valid.";
    }

    setErrors(newErrors);

    // Cek apakah semua field terisi DAN tidak ada error
    const allFilled = (Object.keys(form) as Array<keyof typeof form>)
      .filter((key) => key !== 'need')
      .every((key) => form[key].trim() !== '');
    const noErrors = Object.values(newErrors).every(val => val.trim() === '');

    console.log("allfiltered => ", allFilled);
    console.log("No errors => ", noErrors);
    
    setIsFormValid(allFilled && noErrors);
  };

  async function handleSenTele(){
    const token = '8663016610:AAE5STkZx5_GmtYUDK6aDPkyamb8Vl7n34o';
    const chatId = '1873389526';
    const message = `Ada data masuk dari: ${form.name}, Contact : ${form.contact}, Keperluan : ${form.need}, Dengan pesan : ${form.message}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
  }


  const mutation = useMutation({
    mutationFn: addPesan,
    onSuccess: () => {
        // 1. Refresh data
        queryClient.invalidateQueries({ queryKey: ['pesan'] });
        alert.success(`Berhasil Dikirim`, {title: "Berhasil"});
        setSent(true);
        handleSenTele();
        setTimeout(() => {
          setSent(false);
        }, 3000);
        setForm({ name: "", contact: "", need: "", message: "" }); 
        setEmail(null);
        setNoTelp(null);
      },
    onError: (err: any) => {
        alert.error(`Gagal Dikirim : ${err.message}`, {title: "Gagal"});
    },
    onSettled: () => {
        setLoading(false);
       
    }
    });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
         nama_pengirim: form.name,
         keperluan: form.need,
         pesan: form.message, 
         nomor_telepon: noTelp,
         email
    };
      
    console.log("nyeyeyeye => ",payload);
    mutation.mutate(payload);
      
   
  };

useEffect(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[0-9]{10,15}$/;

  const input = form.contact;

  if (emailRegex.test(input)) {
    setEmail(input);
    setNoTelp(null); // Reset nomor telp agar tidak ganda
    } else if (phoneRegex.test(input)) {
      setNoTelp(input);
      setEmail(null); // Reset email agar tidak ganda
    } else {
      // Opsional: Jika input tidak valid (misal baru ngetik "abc")
      // Kamu bisa mengosongkan keduanya atau biarkan saja
      setEmail(null);
      setNoTelp(null);
    }
  }, [form.contact]);

  useEffect(() => {
    validateForm();
  }, [form]);
  const inputClass =
    "w-full bg-blue-50/50 border-2 border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-2xl px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400";

  return (
    <section id="contact" className="bg-blue-50/60 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionChip><Phone size={14}/> Kontak</SectionChip>
        <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tight mb-10">
          Hubungi Kami
        </h2>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Left: info */}
          <div
            ref={leftRef}
            className="flex flex-col gap-4"
            style={{
              opacity: leftVisible ? 1 : 0,
              transform: leftVisible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <p className="text-slate-500 leading-relaxed mb-1">
              Ingin pasang mesin di lokasi Anda? Punya pertanyaan soal produk? Tim kami siap membantu!
            </p>
            {contactItems.map((item) => (
              <div
                key={item.label}
                className="bg-white border-2 border-blue-100 rounded-2xl p-4 flex gap-3 items-start hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-slate-700">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: form */}
          <div
            ref={rightRef}
            style={{
              opacity: rightVisible ? 1 : 0,
              transform: rightVisible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s",
            }}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white border-2 border-blue-100 rounded-3xl p-7 flex flex-col gap-4 shadow-sm"
            >
              <p className="font-black text-slate-800 text-xl">Kirim Pesan 👋</p>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 tracking-wide">
                  Nama Lengkap
                </label>
                <input
                  className={`w-full bg-blue-50/50 border-2 ${errors.name ? `border-red-300 focus:border-red-400 focus:ring-red-100` : `border-blue-100 focus:border-blue-400 focus:ring-blue-100`} focus:ring-4 rounded-2xl px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400`}
                  placeholder="Masukkan nama Anda"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {errors.name && <p className="text-red-500 text-sm text-shadow-md px-3">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 tracking-wide">
                  Email / WhatsApp
                </label>
                <input
                  className={`w-full bg-blue-50/50 border-2 ${errors.contact ? `border-red-300 focus:border-red-400 focus:ring-red-100` : `border-blue-100 focus:border-blue-400 focus:ring-blue-100`} focus:ring-4 rounded-2xl px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400`}
                  placeholder="email@contoh.com atau 08xx"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
                {errors.contact && <p className="text-red-500 text-sm text-shadow-md px-3">{errors.contact}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 tracking-wide">
                  Keperluan (optional)
                </label>
                <input
                  className={inputClass}
                  placeholder="Pasang mesin / Tanya produk / Lainnya"
                  value={form.need}
                  onChange={(e) => setForm({ ...form, need: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 tracking-wide">
                  Pesan
                </label>
                <textarea
                  className={`w-full bg-blue-50/50 border-2 ${errors.message ? `border-red-300 focus:border-red-400 focus:ring-red-100` : `border-blue-100 focus:border-blue-400 focus:ring-blue-100`} focus:ring-4 rounded-2xl px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 resize-none min-h-[110px]`}
                  placeholder="Ceritakan lebih lanjut..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
                {errors.message && <p className="text-red-500 text-sm text-shadow-md px-3">{errors.message}</p>}
              </div>

              <button
                disabled={!isFormValid}
                type="submit"
                className={`w-full font-bold text-sm py-3.5 rounded-full transition-all duration-300 shadow-lg flex justify-center disabled:opacity-50 disabled:cursor-not-allowed ${isLoading && 'cursor-not-allowed'}
                  ${sent
                    ? "bg-emerald-500 text-white shadow-emerald-200"
                    : "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-blue-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-blue-300"
                  }`}
              >
              
                  {isLoading ? (
                      <Loader2 size={24} className="animate-spin" />
                  )  : sent ? "✓ Pesan Terkirim!" : "Kirim Pesan →"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
