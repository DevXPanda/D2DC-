import "./globals.css";
import AppConvexProvider from "@/components/convex-provider";
import { ToastProvider } from "@/components/toast";

export const metadata = {
  title: "D2DC Admin System",
  description: "Door-to-door collection admin panel"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppConvexProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AppConvexProvider>
      </body>
    </html>
  );
}
