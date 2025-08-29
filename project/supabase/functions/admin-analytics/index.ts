import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the user and verify admin access
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const url = new URL(req.url)
    const endpoint = url.pathname.split('/').pop()

    switch (endpoint) {
      case 'overview':
        return await getDashboardOverview(supabaseClient)
      case 'newsletter-stats':
        return await getNewsletterStats(supabaseClient)
      case 'newsletter-export':
        return await exportNewsletterSubscribers(supabaseClient)
      case 'newsletter-subscribers':
        return await getNewsletterSubscribersPaginated(supabaseClient, url.searchParams)
      case 'trips':
        return await getTripAnalytics(supabaseClient, url.searchParams)
      case 'users':
        return await getUserAnalytics(supabaseClient, url.searchParams)
      case 'revenue':
        return await getRevenueAnalytics(supabaseClient, url.searchParams)
      case 'performance':
        return await getPerformanceMetrics(supabaseClient, url.searchParams)
      case 'export':
        return await exportData(supabaseClient, url.searchParams)
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function getDashboardOverview(supabaseClient: ReturnType<typeof createClient>) {
  const { data, error } = await supabaseClient
    .from('dashboard_overview')
    .select('*')
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function getNewsletterStats(supabaseClient: ReturnType<typeof createClient>) {
  const { data, error, count } = await supabaseClient
    .from('newsletter_subscribers')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .limit(1)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(
    JSON.stringify({
      total: count || 0,
      active: count || 0
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function getNewsletterSubscribersPaginated(supabaseClient: ReturnType<typeof createClient>, searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const active = searchParams.get('active')
  const search = searchParams.get('search')

  let query = supabaseClient
    .from('newsletter_subscribers')
    .select('*', { count: 'exact' })
    .order('subscribed_at', { ascending: false })

  if (active !== null) {
    query = query.eq('is_active', active === 'true')
  }

  if (search) {
    query = query.ilike('email', `%${search}%`)
  }

  const { data, error, count } = await query
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(
    JSON.stringify({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function exportNewsletterSubscribers(supabaseClient: ReturnType<typeof createClient>) {
  const { data, error } = await supabaseClient
    .from('newsletter_subscribers')
    .select('email, subscribed_at, source, preferences')
    .eq('is_active', true)
    .order('subscribed_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Format for CSV export
  const csvData = (data || []).map(subscriber => ({
    email: subscriber.email,
    subscribed_date: new Date(subscriber.subscribed_at).toLocaleDateString(),
    source: subscriber.source,
    preferences: JSON.stringify(subscriber.preferences)
  }))

  return new Response(
    JSON.stringify(csvData),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function getTripAnalytics(supabaseClient: ReturnType<typeof createClient>, searchParams: URLSearchParams) {
  const days = parseInt(searchParams.get('days') || '30')
  
  const { data, error } = await supabaseClient
    .from('trip_analytics')
    .select('*')
    .gte('trip_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('trip_date', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function getUserAnalytics(supabaseClient: ReturnType<typeof createClient>, searchParams: URLSearchParams) {
  const role = searchParams.get('role')
  
  let query = supabaseClient
    .from('user_analytics')
    .select('*')

  if (role) {
    query = query.eq('role', role)
  }

  const { data, error } = await query

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function getRevenueAnalytics(supabaseClient: ReturnType<typeof createClient>, searchParams: URLSearchParams) {
  const days = parseInt(searchParams.get('days') || '30')
  
  const { data, error } = await supabaseClient
    .from('revenue_analytics')
    .select('*')
    .gte('transaction_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('transaction_date', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function getPerformanceMetrics(supabaseClient: ReturnType<typeof createClient>, searchParams: URLSearchParams) {
  const type = searchParams.get('type') || 'drivers'
  
  const viewName = type === 'drivers' ? 'driver_performance' : 'support_worker_performance'
  
  const { data, error } = await supabaseClient
    .from(viewName)
    .select('*')
    .order('total_trips', { ascending: false })
    .limit(50)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function exportData(supabaseClient: ReturnType<typeof createClient>, searchParams: URLSearchParams) {
  const table = searchParams.get('table')
  const format = searchParams.get('format') || 'json'
  
  if (!table) {
    return new Response(
      JSON.stringify({ error: 'Table parameter required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Define allowed tables for export
  const allowedTables = ['bookings', 'profiles', 'vehicles', 'support_workers', 'trip_logs']
  
  if (!allowedTables.includes(table)) {
    return new Response(
      JSON.stringify({ error: 'Table not allowed for export' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  const { data, error } = await supabaseClient
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000) // Limit for performance

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (format === 'csv') {
    // Convert to CSV
    if (!data || data.length === 0) {
      return new Response('No data available', {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${table}-export.csv"`
        },
      })
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          }
          return `"${String(value || '').replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')

    return new Response(csvContent, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${table}-export-${new Date().toISOString().split('T')[0]}.csv"`
      },
    })
  }

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}