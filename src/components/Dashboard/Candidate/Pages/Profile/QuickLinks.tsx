import { useState, useEffect, useRef, FunctionComponent } from 'react';

// Define the sections for the quick links
const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'responsibilities', label: 'Responsibilities' },
  { id: 'core-skills', label: 'Core Skills' },
  { id: 'soft-skills', label: 'Soft Skills' },
  { id: 'technical-skills', label: 'Technical Skills' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'industry', label: 'Industry' },
  { id: 'department', label: 'Department' },
  { id: 'locations', label: 'Locations' },
  { id: 'salary', label: 'Salary' }
];

const QuickLinks: FunctionComponent = () => {
  const [activeSection, setActiveSection] = useState<string>('about');
  const observer = useRef<IntersectionObserver | null>(null);
  
  // Set up intersection observer to detect which section is currently visible
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    };

    observer.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, options);

    // Observe all section elements
    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.current?.observe(element);
      }
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);
  
  // Handle click on a quick link
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-0 left-0 h-screen w-[198px] z-10">
      <div className="absolute top-0 left-0 rounded-3xl bg-white w-[198px] h-[610px] overflow-auto shadow-md">
        <div className="px-4 pt-8 pb-2">
          <div className="text-[16px] text-black text-left font-semibold">Quick links</div>
        </div>
        
        <div className="p-3 flex flex-col items-start justify-start gap-1">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`w-full rounded-[10px] px-3 py-2 text-left transition-colors duration-200 hover:bg-gray-100 ${
                activeSection === id ? 'bg-whitesmoke font-medium text-black' : 'text-darkslategray'
              }`}
            >
              <div className="leading-[20px]">{label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickLinks;