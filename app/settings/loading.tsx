import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50/50 pb-10">
            <div className="container mx-auto p-6 md:py-10">
                <div className="mb-8">
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="flex-1 space-y-6">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-[1px] w-full" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
