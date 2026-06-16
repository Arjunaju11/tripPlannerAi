import { Link } from "react-router-dom";
import { Button, Card } from "../components/ui";

export function NotFoundPage() {
  return (
    <Card>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="my-3 text-sm text-slate-500">The page you requested does not exist or is no longer available.</p>
      <Link to="/"><Button>Go home</Button></Link>
    </Card>
  );
}
