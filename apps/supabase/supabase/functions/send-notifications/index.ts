import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushNotification } from '../_shared/push-sender.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

type NotificationType = 'match-builder-open' | 'results-ready';

interface NotificationConfig {
  title: string;
  body: string;
}

const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationConfig> = {
  'match-builder-open': {
    title: 'Match Builder is Open 🏟️',
    body: 'Build your squad now — deadline approaching',
  },
  'results-ready': {
    title: 'Results Are In! 🎯',
    body: 'See how your picks scored this gameweek',
  },
};

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const type: NotificationType = body?.type;
    // payload is optional metadata — not used in notification content for MVP
    // const payload = body?.payload;

    if (!type || !NOTIFICATION_TEMPLATES[type]) {
      return Response.json(
        { data: null, error: { code: 'INVALID_TYPE', message: `Unknown notification type: ${type}` } },
        { status: 400 },
      );
    }

    const template = NOTIFICATION_TEMPLATES[type];

    // Query all users with a registered push token
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('push_token')
      .not('push_token', 'is', null);

    if (queryError) {
      console.error('[send-notifications] Failed to query users:', queryError);
      return Response.json(
        { data: null, error: { code: 'DB_QUERY_FAILED', message: queryError.message } },
        { status: 500 },
      );
    }

    // Collect valid (non-null, non-empty) push tokens
    const tokens: string[] = (users ?? [])
      .map((u: { push_token: string | null }) => u.push_token)
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

    if (tokens.length === 0) {
      return Response.json(
        { data: { sent: 0, failed: 0 }, error: null },
        { status: 200 },
      );
    }

    const result = await sendPushNotification(template.title, template.body, tokens);

    return Response.json(
      { data: { sent: result.sent, failed: result.failed }, error: null },
      { status: 200 },
    );
  } catch (err) {
    console.error('[send-notifications] Unexpected error:', err);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: String(err) } },
      { status: 500 },
    );
  }
});

