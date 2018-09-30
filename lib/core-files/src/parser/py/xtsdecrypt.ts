export default {
  name: "xtsdecrypt",
  script: `import argparse
from aes128 import AESXTSN

def main():
  parser = argparse.ArgumentParser(description='Decrypt an AES-128-XTS encrypted file or hex string, pass either "--input" or "--file"')
  parser.add_argument('--key', dest='key', required=True, help='Hex string used for decrypting')
  parser.add_argument('--file', dest='file', required=True, help='Encrypted file to decrypt')
  parser.add_argument('--out', dest='output', help='File to write the decrypted contents, if not supplied output will be send to stdout')
  parser.add_argument('--encode', dest='encode', help='Encode decrypted content to hex before passing to stdout')
  args = parser.parse_args()

  # Ensure Encryption key is valid
  try:
    (args.key).decode('hex')
  except TypeError:
    raise TypeError('Encryption key must be a hex string')

  ciphertext = None

  if args.file is not None:
    inputFile = open(args.file, 'r')
    ciphertext = inputFile.read()
    inputFile.close()

  # Key needs to be a tuple
  key = ((args.key[:len(args.key)/2]).decode('hex'), (args.key[len(args.key)/2:]).decode('hex'))

  # Decrypt the cipher
  decipher = AESXTSN(key)
  deciphertext = decipher.decrypt(ciphertext)

  # If --out is specified write it to the file, else print to stdout
  if args.output is not None:
    outFile = open(args.output, 'w+')
    outFile.write(deciphertext)
    outFile.close()
  else:
    if args.encode is not None:
      print((deciphertext).encode('hex'))
    else:
      print(deciphertext)

main()
`
};
