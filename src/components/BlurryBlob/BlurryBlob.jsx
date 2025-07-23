import { cn } from '@/lib/utils';

function BlurryBlob({ className, firstBlobColor, secondBlobColor,parentStyle="z-[-9]" }) {
  return (
    <div className={`absolute items-center justify-center min-h-52 min-w-52 ${parentStyle}`}>
      <div className="relative w-full max-w-lg">
        <div
          className={cn(
            'absolute -right-24 -top-28 h-72 w-72 animate-pop-blob rounded-sm bg-blue-200 p-8 opacity-45 mix-blend-multiply blur-3xl filter',
            className,
            firstBlobColor
          )}
        ></div>
        <div
          className={cn(
            'absolute -left-40 -top-64 h-72 w-72 animate-pop-blob rounded-sm bg-purple-300 p-8 opacity-45 mix-blend-multiply blur-3xl filter',
            className,
            secondBlobColor
          )}
        ></div>
      </div>
    </div>
  );
}

export default BlurryBlob;
