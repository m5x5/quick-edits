type CardProps = {
  description: string;
  icon: React.ReactNode;
  name: string;
};

export default function Card({ description, icon, name }: CardProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      {icon}
      <span className="text-base font-medium">{name}</span>
      <span className="text-xs text-gray-500 hidden">{description}</span>
    </div>
  );
}
