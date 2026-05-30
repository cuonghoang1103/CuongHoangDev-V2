import ProjectsClient from './ProjectsClient';

async function getProjects() {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';
  try {
    const res = await fetch(`${base}/api/v1/projects?page=0&size=9`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.content ?? [];
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const initialProjects = await getProjects();

  return (
    <div className="min-h-screen bg-darkbg pt-24 pb-20">
      {/* Header */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-indigo/15 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-violet/15 rounded-full blur-[128px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-text-primary mb-6">
            My <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia">Projects</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Products I have built throughout my learning and development journey
          </p>
        </div>
      </section>

      <ProjectsClient initialProjects={initialProjects} />
    </div>
  );
}
