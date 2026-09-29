"use client";

import { useQuery } from "@tanstack/react-query";
import { listarEscuelas } from "@/lib/api/escuelas";

export function useEscuelas() {
    const query = useQuery({
        queryKey: ["escuelas"],
        queryFn: listarEscuelas,
        staleTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
    });

    return {
        escuelas: query.data ?? [],
        isCargando: query.isPending || query.isFetching,
        error: query.isError ? "No pudimos cargar las escuelas. Reintenta." : null,
        reintentar: query.refetch,
    };
}
