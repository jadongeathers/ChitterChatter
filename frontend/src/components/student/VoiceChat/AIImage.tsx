import React from "react";
import { Card } from "@/components/ui/card";

interface AIImageProps {
  scenarioImageUrl: string;
}

const AIImage: React.FC<AIImageProps> = ({ scenarioImageUrl }) => {
  return (
    <Card className="h-full w-full overflow-hidden">
      <div className="h-full w-full flex items-center justify-center">
        <img
          src={scenarioImageUrl}
          alt="Scenario"
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='20'>Image unavailable</text></svg>";
          }}
        />
      </div>
    </Card>
  );
};

export default AIImage;