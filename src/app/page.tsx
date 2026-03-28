//page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NewsCard, ContentPost } from "./components/NewsCard";
/*import QuickDonate from "./components/QuickDonate";
*/
interface Product {
  id: number;
  name: string;
  description: string;
  shortDescription: string | null;
  imageUrl: string | null;
  secondaryImageUrl: string | null;
  category: string;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
  rang: number;
}

// مكون عرض تفاصيل المشروع
function ProjectDetailModal({ 
  project, 
  isOpen, 
  onClose 
}: { 
  project: Product | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="relative h-[70vh] w-full">
          <Image 
            src={project.imageUrl || project.secondaryImageUrl || '/default-image.jpg'}
            alt={project.name}
            fill
            className="object-contain"
          />
        </div>
        <div className="p-6">
          <button 
            onClick={onClose}
            className="absolute top-2 left-2 text-white bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold"
          >
            X
          </button>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{project.name}</h2>
          <p className="text-gray-600 text-lg mb-4">{project.description}</p>
          {project.category && (
            <div className="inline-block bg-amber-600 text-white px-3 py-1 rounded-full text-sm mb-4">
              {project.category}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [contentPosts, setContentPosts] = useState<ContentPost[]>([]); 
  const [selectedProject, setSelectedProject] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/carousel-images');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setImages(data.map((img: { imageUrl: string }) => img.imageUrl));
      } catch (error) {
        console.error("Error fetching carousel images:", error);
        // Remove this fallback if you are confident in API stability
        // setImages(["/3id lkbir.jpg", "/7afr abar.jpg", "/kiswat il 3aid.jpg", "/mi7t itlmi4.jpg", "/koft ram4an.jpg", "/ta7sin maskan.jpg", "/iftar saim.jpg"]);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length === 0) return; // Don't start interval if no images

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // تغيير الصورة كل 3 ثواني

    return () => clearInterval(interval);
  }, [images]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'فشل في جلب البيانات');
        }
        const data: Product[] = await response.json();
        // Sort products by rang property
        const sortedProducts = data.sort((a, b) => a.rang - b.rang);
        setProducts(sortedProducts);
      } catch (err: unknown) {
        console.error('Error:', err);
      }
    };

    const fetchContentPosts = async () => {
      try {
        const response = await fetch('/api/content-posts?limit=2');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'فشل في جلب المستجدات');
        }
        const data: ContentPost[] = await response.json();
        setContentPosts(data);
      } catch (err: unknown) {
        console.error('Error fetching content posts:', err);
      }
    };

    fetchProducts();
    fetchContentPosts(); // Fetch content posts
  }, []); // Moved clearInterval to the correct useEffect

  // Auto-scrolling for projects
  useEffect(() => {
    const container = document.getElementById('projects-container');
    if (!container || products.length === 0) return;

    console.log('Container scrollWidth:', container.scrollWidth);
    console.log('Container clientWidth:', container.clientWidth);
    console.log('Container scrollLeft (initial):', container.scrollLeft);

    const cardWidth = 288 + 24; // w-72 (288px) + gap-6 (24px)
    const singleSetWidth = products.length * cardWidth; 

    // Initialize scroll position to the beginning of the first set (visual right in RTL)
    container.scrollLeft = 0; 

    const scrollAmount = 1; // Adjust this value for scroll speed
    const scrollInterval = 20; // Adjust this value for smoother animation

    const interval = setInterval(() => {
      // When scrollLeft goes beyond the logical end of the first set, reset to the start of the second.
      if (container.scrollLeft >= singleSetWidth) {
        container.scrollLeft = 0; // Reset to the beginning of the first set (visual right)
      } else {
        container.scrollLeft += scrollAmount; // Scroll to the left (increase scrollLeft)
      }
    //  console.log('Container scrollLeft (current):', container.scrollLeft);
    }, scrollInterval);

    return () => clearInterval(interval);
  }, [products]);

  const handleProjectClick = (project: Product) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <div className="relative z-50">
          {/*   <QuickDonate /> */}
        </div>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Right side - Text */}
            <div className="flex-1 text-right space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-green-700">
                أسهم الفرحة
              </h1>
              <p className="text-xl md:text-2xl font-semibold text-amber-600">
                &quot;بمساهمتكم.. فرحة العيد تبدأ من هنا&quot;
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                بفضل الله, وبعد إنجاحكم لمبادرة &apos;أسهم الرحمة&apos; في قفة رمضان, نواصل معكم العطاء لإسعاد 280 طفل. هدفنا توفير كسوة العيد كاملة تليق ببراءتهم
              </p>
            </div>
            {/* Left side - Carousel */}
            <div className="flex-1 relative h-72 md:h-96 w-full">
              {images.length > 0 && (
                <Image src={images[currentImageIndex]} alt="صورة متغيرة" fill style={{ objectFit: 'contain' }} priority={true} />
              )}
            </div>
          </div>
        </section>
        <section className="py-12 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              مشاريعنا
            </h2>
            <div id="projects-container" className="flex flex-nowrap flex-row-reverse overflow-x-scroll scroll-auto hide-scrollbar gap-6 py-4 px-8 w-full" dir="rtl">
              {products.map((product) => (
                <div key={product.id} className="flex-none w-72 flex-shrink-0">
                  <div 
                    className="p-6 rounded-lg shadow-md bg-gray-100 cursor-pointer hover:shadow-lg transition-shadow duration-300 h-[250px]"
                    onClick={() => handleProjectClick(product)}
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                      {product.secondaryImageUrl ? (
                        <Image
                          src={product.secondaryImageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          style={{ objectFit: 'cover' }}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          لا توجد صورة
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-center mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-center text-sm">
                      {product.shortDescription || product.description}
                    </p>
                  </div>
                </div>
              ))}
              {/* Duplicate products for infinite scrolling */}
              {products.map((product) => (
                <div key={product.id + '-duplicate'} className="flex-none w-72 flex-shrink-0">
                  <div 
                    className="p-6 rounded-lg shadow-md bg-gray-100 cursor-pointer hover:shadow-lg transition-shadow duration-300 h-[250px]"
                    onClick={() => handleProjectClick(product)}
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                      {product.secondaryImageUrl ? (
                        <Image
                          src={product.secondaryImageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          style={{ objectFit: 'cover' }}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          لا توجد صورة
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-center mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-center text-sm">
                      {product.shortDescription || product.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
          </div>

          <style jsx>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .hide-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </section>

        {/* مكون عرض تفاصيل المشروع */}
        <ProjectDetailModal 
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
        
        {/* قسم المستجدات */}
        {contentPosts.length > 0 && (
  <section className="py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          اخر المستجدات
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-amber-600 mx-auto rounded-full"></div>
      </div>
      
      {contentPosts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {contentPosts.map((post, index) => (
            <NewsCard key={post.id} post={post} index={index} />
          ))}
        </div>
      )}
      <div className="text-center mt-8">
        <Link href="/new" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors duration-300">
          عرض المزيد من المستجدات
        </Link>
      </div>
    </div>
  </section>
)}
{/* قسم الانخراط والتطوع والتكفل */}
<section className="py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* بطاقة الانخراط */}
      <div className="p-8 rounded-lg shadow-md flex flex-col items-center text-center hover:shadow-xl transition-all h-60 bg-gray-50">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-800">انخرط</h3>
        <p className="text-gray-600">
          كن جزءًا من عائلتنا وساهم في دعم الأطفال والأسر عبر الانخراط في الجمعية.
        </p>
      </div>

      {/* بطاقة التطوع */}
      <Link href="/tataw3" className="block">
        <div className="p-8 rounded-lg shadow-md flex flex-col items-center text-center hover:shadow-xl transition-all h-60 bg-gray-50">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-800">تطوع</h3>
          <p className="text-gray-600">
            شارك بوقتك وخبرتك وساعد في تحسين حياة الأطفال والأسر.
          </p>
        </div>
      </Link>

      {/* بطاقة التكفل باليتيم*/}
      <div className="p-8 rounded-lg shadow-md flex flex-col items-center text-center hover:shadow-xl transition-all h-60 bg-gray-50 relative overflow-hidden">
        
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-800">اكفل يتيم</h3>
        <p className="text-gray-600">
          تبنَّ كفالة يتيم وكن له سنداً وعائلة بديلة توفر له الرعاية والتعليم.
        </p>
      </div>
    </div>
  </div>
</section>
      </main>
    </div>
  );
}