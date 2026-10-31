import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"

interface PlaceholderPageProps {
  title: string
  description: string
  note?: string
}

export function PlaceholderPage({ title, description, note }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex min-h-48 flex-col items-center justify-center gap-2 py-10 text-center">
          <p className="text-sm font-medium">Halaman ini sedang disiapkan</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {note ?? "Layar ini akan diisi pada fase implementasi berikutnya."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
