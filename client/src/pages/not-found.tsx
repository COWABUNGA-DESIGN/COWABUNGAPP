import notFoundImage from "@assets/IMG_0708_1763376676080.jpeg";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
      <img 
        src={notFoundImage} 
        alt="Page not found" 
        className="w-full max-w-2xl rounded-lg shadow-lg mb-6"
      />
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Page not found</h1>
        <p className="text-muted-foreground">
          If you think this is a mistake, check the status page for active incidents, contact support or ask the community.
        </p>
      </div>
    </div>
  );
}
