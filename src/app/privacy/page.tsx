export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-400 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="space-y-4 text-gray-700">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold mt-6">Information We Collect</h2>
          <p>We only collect the information you provide when creating an account: your email address and password.</p>
          
          <h2 className="text-xl font-semibold mt-6">How We Use Your Information</h2>
          <p>Your information is used solely to provide you access to your personal love notes and affirmations.</p>
          
          <h2 className="text-xl font-semibold mt-6">Data Storage</h2>
          <p>All data is stored securely using Supabase, a trusted cloud database provider.</p>
          
          <h2 className="text-xl font-semibold mt-6">Contact</h2>
          <p>For privacy questions, contact us at: your-email@example.com</p>
        </div>
      </div>
    </div>
  );
}
