import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import StatsBar from "../components/landing/StatsBar";
import HowItWorks from "../components/landing/HowItWorks";
import Products from "../components/landing/Products";
import Machines from "../components/landing/Machines";
import About from "../components/landing/About";
import Contact from "../components/landing/Contact";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="bg-[#f8faff] text-slate-900 font-sans antialiased">
      <Navbar />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <Products />
      <Machines />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}
