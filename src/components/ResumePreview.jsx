import { forwardRef } from 'react';
import { useResume } from '../store/ResumeContext';
import ClassicTemplate from './templates/ClassicTemplate';
import ModernTemplate from './templates/ModernTemplate';
import MinimalistTemplate from './templates/MinimalistTemplate';
import ExecutiveTemplate from './templates/ExecutiveTemplate';
import TechTemplate from './templates/TechTemplate';
import FreshTemplate from './templates/FreshTemplate';

const templateMap = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimalist: MinimalistTemplate,
  executive: ExecutiveTemplate,
  tech: TechTemplate,
  fresh: FreshTemplate,
};

const ResumePreview = forwardRef(function ResumePreview(props, ref) {
  const { resumeData, activeTemplate, enabledSections } = useResume();
  const Template = templateMap[activeTemplate] || ClassicTemplate;

  return (
    <div ref={ref} className="flex justify-center">
      <div
        className="shadow-xl rounded-lg overflow-hidden"
        style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.6)', transformOrigin: 'top center' }}
      >
        <Template data={resumeData} sections={enabledSections} />
      </div>
    </div>
  );
});

export default ResumePreview;
