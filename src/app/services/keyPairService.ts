import nacl from 'tweetnacl'
import base64 from 'base64-js'
import { PublicPRivateKeys } from '../Dtos/publicPrivateKeys.js'

export class KeyPairService{


    static generatePublicPrivateKeyPair(): PublicPRivateKeys{
        const keyPair = nacl.sign.keyPair()

        const private_key_base64 = base64.fromByteArray(keyPair.secretKey)
        const public_key_base64 = base64.fromByteArray(keyPair.publicKey)

        const keys: PublicPRivateKeys = {
            publicKey: public_key_base64,
            privateKey: private_key_base64
        }
        return keys

    }
    
}