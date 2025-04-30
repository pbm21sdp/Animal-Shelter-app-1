import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, PawPrint } from "lucide-react";

const AdoptionProcessPage = () => {
  const steps = [
    {
      title: "Căutarea animalului potrivit",
      content: "Răsfoiți galeria noastră de animale și alegeți companionul potrivit pentru dumneavoastră."
    },
    {
      title: "Aplicarea pentru adopție",
      content: "Completați formularul nostru online pentru a iniția procesul de adopție."
    },
    {
      title: "Interviul și verificarea",
      content: "Vom programa un interviu telefonic și vom verifica condițiile de viață pentru animal."
    },
    {
      title: "Întâlnirea cu animalul",
      content: "Vă vom programa o întâlnire pentru a vă cunoaște viitorul companion."
    },
    {
      title: "Finalizarea documentației",
      content: "Semnați contractul de adopție și primiți toate documentele necesare."
    },
    {
      title: "Acasă la familie!",
      content: "Luați noul membru al familiei acasă și începeți aventura împreună!"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <header className="bg-teal-600 w-full text-white py-6">
        <div className="container mx-auto px-4 flex items-center">
          <Link to="/" className="flex items-center hover:text-teal-200 transition-colors">
            <ChevronLeft className="h-8 w-8" />
            <span className="ml-2 text-lg">Înapoi</span>
          </Link>
          <h1 className="text-3xl font-bold mx-auto flex items-center">
            <PawPrint className="mr-3 h-8 w-8" />
            Procesul de Adopție
          </h1>
        </div>
      </header>

      {/* Conținut principal */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-teal-800">
            Pașii adopției în 6 etape simple
          </h2>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100"
            >
              <div className="flex items-start">
                <div className="bg-teal-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <span className="text-teal-600 font-bold text-xl">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-teal-800">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="mt-12 text-center">
            <Link
              to="/available-pets"
              className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              <PawPrint className="mr-2 h-5 w-5" />
              Vezi animalele disponibile
            </Link>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default AdoptionProcessPage;