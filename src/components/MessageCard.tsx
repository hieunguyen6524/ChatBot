// components/MessageCard.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MessageCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="pt-0">{children}</CardContent>
      </Card>
    </motion.div>
  );
};
