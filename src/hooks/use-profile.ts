import { useQuery } from "@tanstack/react-query"

import { userApi } from "@/lib/api/user"
import { queryKeys } from "@/lib/query-keys"

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.user.me,
    queryFn: () => userApi.me(),
  })
}
