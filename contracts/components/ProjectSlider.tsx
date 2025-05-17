import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import ProjectCard from '@/components/ProjectCard';

export default function ProjectSlider({ projects, onDelete, onCreate, gaslessEnabled, tier }) {
  if (!projects || projects.length === 0) {
    return (
      <div className="text-center text-blue-700 dark:text-blue-400">
        No projects yet. Click <span className="font-semibold">"New Project"</span> to create one.
      </div>
    );
  }

  return (
    <Swiper
      key={projects.map((p) => p.projectId).join('-')}
      modules={[Navigation]}
      spaceBetween={20}
      slidesPerView={2}
      breakpoints={{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
        1280: { slidesPerView: 4 },
      }}
      navigation
      grabCursor
      className="w-full"
    >
      {projects.map((project) => (
        <SwiperSlide key={project.projectId.toString()}>
          <ProjectCard
            project={project}
            onDelete={onDelete}
            onCreate={onCreate}
            gaslessEnabled={gaslessEnabled}
            tier={tier}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
