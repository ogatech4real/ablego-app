import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface NewsletterState {
  isSubmitting: boolean;
  isSubscribed: boolean;
  error: string | null;
  successMessage: string | null;
}

export const useNewsletter = () => {
  const [state, setState] = useState<NewsletterState>({
    isSubmitting: false,
    isSubscribed: false,
    error: null,
    successMessage: null
  });

  const subscribe = async (email: string, source: string = 'footer_signup') => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setState(prev => ({
        ...prev,
        error: 'Please enter a valid email address',
        successMessage: null
      }));
      return { success: false, error: 'Invalid email format' };
    }

    setState(prev => ({
      ...prev,
      isSubmitting: true,
      error: null,
      successMessage: null
    }));

    try {
      // Check if email already exists
      const { data: existingSubscriber, error: checkError } = await supabase
        .from('newsletter_subscribers')
        .select('email, is_active, unsubscribed_at')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new subscribers
        throw new Error(`Database error: ${checkError.message}`);
      }

      if (existingSubscriber) {
        if (existingSubscriber.is_active) {
          setState(prev => ({
            ...prev,
            isSubmitting: false,
            error: 'You are already subscribed to our newsletter!',
            successMessage: null
          }));
          return { success: false, error: 'Already subscribed' };
        } else {
          // Reactivate subscription
          const { error: reactivateError } = await supabase
            .from('newsletter_subscribers')
            .update({
              is_active: true,
              subscribed_at: new Date().toISOString(),
              unsubscribed_at: null,
              source: source,
              updated_at: new Date().toISOString()
            })
            .eq('email', email.toLowerCase().trim());

          if (reactivateError) {
            throw new Error(`Failed to reactivate subscription: ${reactivateError.message}`);
          }

          setState(prev => ({
            ...prev,
            isSubmitting: false,
            isSubscribed: true,
            error: null,
            successMessage: 'Welcome back! Your newsletter subscription has been reactivated.'
          }));
          return { success: true, message: 'Subscription reactivated' };
        }
      }

      // Create new subscription
      const { data: newSubscriber, error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: email.toLowerCase().trim(),
          source: source,
          preferences: {
            updates: true,
            safety_tips: true,
            stories: true
          }
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          // Unique constraint violation - email already exists
          setState(prev => ({
            ...prev,
            isSubmitting: false,
            error: 'You are already subscribed to our newsletter!',
            successMessage: null
          }));
          return { success: false, error: 'Already subscribed' };
        }
        throw new Error(`Subscription failed: ${insertError.message}`);
      }

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSubscribed: true,
        error: null,
        successMessage: 'Thank you for subscribing! You\'ll receive updates about new features, safety tips, and community stories.'
      }));

      console.log('Newsletter subscription successful:', newSubscriber);
      return { success: true, data: newSubscriber };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Subscription failed. Please try again.';
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage,
        successMessage: null
      }));
      return { success: false, error: errorMessage };
    }
  };

  const unsubscribe = async (email: string) => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      error: null,
      successMessage: null
    }));

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
          is_active: false,
          unsubscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase().trim());

      if (error) {
        throw new Error(`Unsubscribe failed: ${error.message}`);
      }

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSubscribed: false,
        error: null,
        successMessage: 'You have been unsubscribed from our newsletter.'
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unsubscribe failed. Please try again.';
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage,
        successMessage: null
      }));
      return { success: false, error: errorMessage };
    }
  };

  const clearMessages = () => {
    setState(prev => ({
      ...prev,
      error: null,
      successMessage: null
    }));
  };

  const resetState = () => {
    setState({
      isSubmitting: false,
      isSubscribed: false,
      error: null,
      successMessage: null
    });
  };

  return {
    ...state,
    subscribe,
    unsubscribe,
    clearMessages,
    resetState
  };
};