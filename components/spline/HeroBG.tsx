import dynamic from 'next/dynamic';

const Spline = dynamic(() => import('@splinetool/react-spline'));

export default function Home() {
  return (
    <main className='-z-0 absolute h-full w-full overflow-hidden'>
      <Spline
        scene="https://prod.spline.design/pufHIJdFYVCEkFA7/scene.splinecode" 
      />

      {/* <Spline
        scene="https://prod.spline.design/fj8RJ1h7iFRtOQID/scene.splinecode" 
      /> */}
      
      {/* <Spline
        scene="https://prod.spline.design/zXXOxTpWFMOLSsMv/scene.splinecode" 
      /> */}
    </main>
  );
}
