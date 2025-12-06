import Spline from '@splinetool/react-spline';

export default function SplineComponent() {
  return (
    <div className="bg-white p-4  rounded-2xl container-main mx-auto my-8">
        <div className='rounded-xl overflow-hidden h-full w-full'>
          <Spline scene="https://prod.spline.design/lxdAxk3OSa2S1OQv/scene.splinecode"/>
        </div>
      </div>
  );
}
