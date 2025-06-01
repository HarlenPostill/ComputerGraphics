import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>3JS Tests</title>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        />

        <meta name="description" content="My interactive 3D portfolio" />
      </head>
      <body>{children}</body>
    </html>
  );
}
