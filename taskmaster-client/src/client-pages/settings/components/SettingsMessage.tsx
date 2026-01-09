import React from "react";

type Props = {
  message: { type: "success" | "error"; text: string } | null;
};

const SettingsMessage: React.FC<Props> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className={`p-3 rounded-lg text-sm ${
        message.type === "success"
          ? "bg-green-500/10 text-green-500"
          : "bg-red-500/10 text-red-500"
      }`}
    >
      {message.text}
    </div>
  );
};

export default SettingsMessage;
