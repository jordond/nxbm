1. Get the `PFS0Header`

- read 16 bytes of the file
- new up `PHS0Header`
- Check if the `Magic` contains `PFS0`

2. Create list of `PFS0Entry`

- Length is found in `PFS0Header.FileCount` (set max as 150)

2. Get name for each entry - For each entry

   - Set position offset to (16 + 24 \* {index})
   - read 24 bytes
   - Create `PFSOEntry`
   - Set position offset to (16 + 24 \* {FileCount} + {Entry.Name_ptr})
   - Get string name by reading each byte until a `0` is found (see xci parse)

3. Find the `PFS0Entry` that contains `.cnmt.xml`
4. Get XML file

- Calculate position offset (16 + 24 \* {FileCount} + {PFS0Header.StringTableSize} + {PFS0Entry.offset})
- Read {`PFS0Entry.Size`} bytes

5. Parse XML File

- TitleID
- ContentType
- Version
