import { pageConfig } from "@/pages/pageConfig";
import { AuthStatus, useAuthStatus } from "@/stores/auth.store";
import { JSX, LazyExoticComponent, Suspense } from "react";
import { Redirect, useLocation } from "wouter";

import { ProgressBar } from "../common/ProgressBar";

export interface PageWrapperProps {
  lazy: LazyExoticComponent<() => JSX.Element>;
  requiresAuth?: boolean;
}

export function PageWrapper(props: PageWrapperProps) {
  const { lazy: LazyPage, requiresAuth } = props;

  const location = useLocation()[0];
  const status = useAuthStatus();
  if (requiresAuth && status === AuthStatus.Unauthenticated) {
    const url = pageConfig.auth + "?continue=" + encodeURIComponent(location);
    return <Redirect to={url} />;
  }

  return (
    <Suspense fallback={<ProgressBar />}>
      <LazyPage />
    </Suspense>
  );
}
