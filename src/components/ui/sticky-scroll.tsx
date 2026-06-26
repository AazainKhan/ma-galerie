"use client";

const COL_A = [
  "https://images.unsplash.com/photo-1718838541476-d04e71caa347?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1715432362539-6ab2ab480db2?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1718601980986-0ce75101d52d?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1685904042960-66242a0ac352?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1719411182379-ffd97c1f7ebf?w=500&auto=format&fit=crop",
];
const COL_MID = [
  "https://images.unsplash.com/photo-1718969604981-de826f44ce15?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476180814856-a36609db0493?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=500&auto=format&fit=crop",
];
const COL_C = [
  "https://images.unsplash.com/photo-1719547907790-f661a88302c2?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1599054799131-4b09c73a63cf?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1719963532023-01b573d1d584?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1714328101501-3594de6cb80f?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1719554873571-0fd6bf322bb1?w=500&auto=format&fit=crop",
];

export default function StickyScroll() {
  return (
    <section className="bg-slate-950">
      <section className="text-white w-full bg-slate-950">
        <div className="grid grid-cols-12 gap-2">
          <div className="grid gap-2 col-span-4">
            {COL_A.map((src) => (
              <figure key={src} className="w-full">
                <img
                  src={src}
                  alt=""
                  className="w-full h-96 align-bottom object-cover rounded-md"
                />
              </figure>
            ))}
          </div>
          <div className="sticky top-0 h-screen w-full col-span-4 gap-2 grid grid-rows-3">
            {COL_MID.map((src) => (
              <figure key={src} className="w-full h-full">
                <img
                  src={src}
                  alt=""
                  className="h-full w-full align-bottom object-cover rounded-md"
                />
              </figure>
            ))}
          </div>
          <div className="grid gap-2 col-span-4">
            {COL_C.map((src) => (
              <figure key={src} className="w-full">
                <img
                  src={src}
                  alt=""
                  className="w-full h-96 align-bottom object-cover rounded-md"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
