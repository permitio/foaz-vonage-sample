import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut, useAuth, useClerk } from '@clerk/clerk-react'
import { Alert, Box, Button, Container, Paper, TextField } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import { FormEvent, useState } from 'react';

const clerkPubKey = import.meta.env.VITE_REACT_APP_CLERK_PUBLISHABLE_KEY;

const SendMessage = () => {
  const { isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const [error, setError] = useState<string | null>('');
  const [success, setSuccess] = useState<string | null>('');
  const [to, setTo] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const send = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = await getToken();
    if (!token) {
      setError('No token');
      return;
    }
    try {
      const res = await fetch('https://proxy.api.permit.io/proxy/9cab406f273644cb84d6800ae00025cc?url=https://api.nexmo.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          from: '14157386102',
          to,
          text: message,
          channel: 'sms',
          message_type: 'text',
        }),
      });
      if (res.status !== 202) {
        const body = await res.json();
        setError(body?.detail || 'Error sending message');
        return;
      }
      setSuccess('Message sent');
    } catch (error: any) {
      setError(error.message);
      return;
    }
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <>
      <Container maxWidth="sm">
        <Paper component={'form'} sx={{ p: 1 }} onSubmit={send}>
          {error && <Alert severity='error' sx={{ mb: 1 }} onClose={() => (setError(''))}>{error}</Alert>}
          {success && <Alert severity='success' sx={{ mb: 1 }} onClose={() => (setSuccess(''))}>{success}</Alert>}
          <Box sx={{ display: 'flex' }}>
            <FormControl sx={{ mb: 1, flex: 1 }}>
              <TextField label='To' id="to" value={to} onChange={(e) => setTo(e.target.value)} />
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <FormControl sx={{ m: 0, minWidth: 200, flex: 1 }}>
              <TextField label='message' id="message" multiline rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            </FormControl>
          </Box>
          <Button variant="contained" type="submit" fullWidth sx={{ mt: 1 }}>Send</Button>
        </Paper>
        <Button variant='outlined' fullWidth sx={{ mt: 1 }} onClick={() => (signOut())}>Sign Out</Button>
      </Container>
    </>
  )
};


function App() {
  return (
    <>
      <ClerkProvider publishableKey={clerkPubKey}>
        <SignedIn>
          <SendMessage />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </ClerkProvider>
    </>
  )
}

export default App
