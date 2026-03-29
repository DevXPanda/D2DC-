import "./globals.css";
import AppConvexProvider from "@/components/convex-provider";

export const metadata = {
  title: "D2DC Admin System",
  description: "Door-to-door collection admin panel"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppConvexProvider>{children}</AppConvexProvider>
      </body>
    </html>
  );
}
