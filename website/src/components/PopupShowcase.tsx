import Image from "next/image";

export default function PopupShowcase() {
  return (
    <section className="w-full py-12 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Powerful Class Management</h2>
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">DevTools-like Interface</h3>
            <p className="text-gray-600">
              Manage your Tailwind CSS classes with a familiar DevTools-like interface.
              Edit, delete, and modify classes in real-time with our intuitive popup.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Smart class variant selection</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Instant class removal</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Undo/Redo support (⌘Z)</span>
              </div>
            </div>
          </div>
          <div className="relative rounded-lg overflow-hidden shadow-xl">
            <Image
              src="/quick-edits-tool.png"
              alt="Quick Edits Popup Interface"
              width={800}
              height={500}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}