import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-[420px] text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-bold">404</CardTitle>
          <CardDescription>La ruta solicitada no existe.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/login">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
