import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>3JS Tests</title>
        <meta name="description" content="My interactive 3D portfolio" />
      </head>
      <body>{children}</body>
    </html>
  );
}
