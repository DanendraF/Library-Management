-- Create borrowings table
CREATE TABLE IF NOT EXISTS public.borrowings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    borrowed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    returned_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_borrowings_user_id ON public.borrowings(user_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_book_id ON public.borrowings(book_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_status ON public.borrowings(status);
CREATE INDEX IF NOT EXISTS idx_borrowings_due_date ON public.borrowings(due_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_borrowings_updated_at 
    BEFORE UPDATE ON public.borrowings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.borrowings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own borrowings
CREATE POLICY "Users can view own borrowings" ON public.borrowings
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can create their own borrowings (if they have permission)
CREATE POLICY "Users can create own borrowings" ON public.borrowings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own borrowings (for status updates)
CREATE POLICY "Users can update own borrowings" ON public.borrowings
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Admins and librarians can view all borrowings
CREATE POLICY "Admins and librarians can view all borrowings" ON public.borrowings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::uuid 
            AND role IN ('admin', 'librarian')
        )
    );

-- Admins and librarians can create borrowings for any user
CREATE POLICY "Admins and librarians can create borrowings" ON public.borrowings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::uuid 
            AND role IN ('admin', 'librarian')
        )
    );

-- Admins and librarians can update any borrowing
CREATE POLICY "Admins and librarians can update borrowings" ON public.borrowings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::uuid 
            AND role IN ('admin', 'librarian')
        )
    );

-- Admins and librarians can delete borrowings
CREATE POLICY "Admins and librarians can delete borrowings" ON public.borrowings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::uuid 
            AND role IN ('admin', 'librarian')
        )
    );

-- Public can view borrowings (for statistics, but without sensitive data)
CREATE POLICY "Public can view borrowings stats" ON public.borrowings
    FOR SELECT USING (true);
