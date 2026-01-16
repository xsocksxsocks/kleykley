-- Add parent_id column to categories table
ALTER TABLE public.categories 
ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Insert parent categories (Ober-Kategorien)
INSERT INTO public.categories (id, name, sort_order, parent_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'KFZ & Werkstatt', 1, NULL),
  ('10000000-0000-0000-0000-000000000002', 'Bau & Container', 2, NULL),
  ('10000000-0000-0000-0000-000000000003', 'Garten & Forst', 3, NULL),
  ('10000000-0000-0000-0000-000000000004', 'Kälte & Klima', 4, NULL),
  ('10000000-0000-0000-0000-000000000005', 'Chemie & Schmierstoffe', 5, NULL),
  ('10000000-0000-0000-0000-000000000006', 'Beauty & Wellness', 6, NULL),
  ('10000000-0000-0000-0000-000000000007', 'Technik & Elektronik', 7, NULL),
  ('10000000-0000-0000-0000-000000000008', 'Sonstiges', 8, NULL);

-- Assign existing categories to parent categories

-- KFZ & Werkstatt
UPDATE public.categories SET parent_id = '10000000-0000-0000-0000-000000000001' 
WHERE name IN (
  'Hebebühne', 'Hebebühnen', 'Achsvermessungsgerät', 'Auswuchtmaschine', 
  'Bremsenprüfstand', 'Bremsenwartung', 'Bremsenreiniger', 'Bremsflüssigkeit',
  'Abgasmessgerät', 'Klimaservicegerät', 'Reifenmontiermaschine', 'Reifenservice',
  'Werkstattausrüstung', 'Werkstattwagen', 'Werkzeugwagen', 'Drehmomentschlüssel',
  'Inspektionskameras', 'Getriebeölwechselservice', 'Ölservice', 'Motoröl',
  'Ladegerät', 'Starthilfegerät', 'Fahrzeug', 'Reifen', 'Radwuchtmaschine',
  'Scheinwerfereinstellgerät', 'Stoßdämpferprüfstand', 'Wagenheber'
) AND parent_id IS NULL;

-- Bau & Container
UPDATE public.categories SET parent_id = '10000000-0000-0000-0000-000000000002' 
WHERE name IN (
  'Baumaschinen', 'Baustellengeräte', 'Baustoffe', 'Baugeräte & Container',
  'Container', 'Abrollcontainer', 'Absetzcontainer', 'Bürocontainer',
  'Arbeitsbühne', 'Flurförderzeuge', 'Gabelstapler', 'Ladekran', 'Krane',
  'Minibagger', 'Radlader', 'Teleskoplader', 'Stapler', 'Hubwagen'
) AND parent_id IS NULL;

-- Garten & Forst
UPDATE public.categories SET parent_id = '10000000-0000-0000-0000-000000000003' 
WHERE name IN (
  'Gartengeräte', 'Kettensäge', 'Motorsäge', 'Motorsense', 'Forstfreischneider',
  'Holzhäcksler', 'Holzhacker', 'Kombihäcksler', 'Blasgerät', 'Laub- und Abfallsauger',
  'Rasentraktor', 'Rasenmäher', 'Vertikutierer', 'Häcksler', 'Freischneider',
  'Laubsauger', 'Trimmer'
) AND parent_id IS NULL;

-- Kälte & Klima
UPDATE public.categories SET parent_id = '10000000-0000-0000-0000-000000000004' 
WHERE name IN (
  'Kältemittel', 'Kältemittel-Identifikator', 'Klimagerät', 'Klimaanlage',
  'Kühlaggregat', 'Kühlzelle', 'Wärmepumpen', 'Heizkanone', 'Heizlüfter',
  'Tiefkühlaggregat', 'Splitklimagerät', 'Klimakompressor'
) AND parent_id IS NULL;

-- Chemie & Schmierstoffe
UPDATE public.categories SET parent_id = '10000000-0000-0000-0000-000000000005' 
WHERE name IN (
  'Chemikalien', 'AdBlue', 'Frostschutzmittel', 'Hydrauliköl', 'Schmierstoffe',
  'Reinigungsmittel', 'Rostlöser', 'Öle', 'Getriebeöl', 'Kühlmittel'
) AND parent_id IS NULL;

-- Beauty & Wellness
UPDATE public.categories SET parent_id = '10000000-0000-0000-0000-000000000006' 
WHERE name IN (
  'Bodyforming-Gerät', 'Kosmetikliege', 'Diodenlaser', 'Lasergerät',
  'Solarium', 'Massageliege', 'Behandlungsliege', 'Medizin & Labor',
  'Fitness & Sport'
) AND parent_id IS NULL;

-- Technik & Elektronik
UPDATE public.categories SET parent_id = '10000000-0000-0000-0000-000000000007' 
WHERE name IN (
  'Elektronik', 'Elektrowerkzeuge', 'Kompressor', 'Kompressoren', 
  'Maschinen & Werkzeug', 'Schweißgerät', 'Stromerzeuger', 'Generator',
  'Solartechnik', 'Absaugstation', 'Farbsprühsysteme', 'Sandstrahlgerät',
  'Druckluft', 'Einzelhandel & Ladenbau', 'Kaffeevollautomat'
) AND parent_id IS NULL;

-- Sonstiges - alle übrigen Kategorien ohne parent_id
UPDATE public.categories SET parent_id = '10000000-0000-0000-0000-000000000008' 
WHERE parent_id IS NULL 
AND id NOT IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000008'
);