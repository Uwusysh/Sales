import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `PORT=5000
NODE_ENV=development
GOOGLE_SHEET_ID=1BUvKvc0E8iynfiixIC9cU_8SrmH6MHf5XJ11892kT7g
GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-access-sales@ai-team-482111.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCaAP4AEgmJotk3\\nVhSv6RZ9e793i2ANEOC8/Lcr4pShASFRDDXP22zDTSps1o0wmnPtUdIA2hGm3N7E\\nioUNww4u8vjK0LKl/brmFm7GtdJ6BTkzTbViPMP6997R8Y4DACoh06jRZCazBvl0\\n2Y/2PxBprlSiguX85ctV0SIYR1TpeuuX1jJpNNFfkUwGLrMwaV1aIBO/RliqR2rr\\nCmfDj8K1bMFa11Blgd9Yey82aY2PeGCWI8dhnCK0GpqN5eb0cLbTBRlLRqdRvHeA\\n4sNF9+KT52jIBzX+FjzIS0Uc7YPNr7d2dOlS1lC6WcI/U/N6qNGvjyzOOwsV8ye4\\nporONy0nAgMBAAECggEALQfbPXQIu+kVMLwH4oP6Yoi7rJ3hYRCtVjVi7f8bzJRD\\nBKrYVUXo4JaAsEBwGmUfPqZtDHi3Lp5ouPlz/FkrnYjIPK2XfzfY3YxzqcDioXFD\\nj3/KaMYx3AF8ctD54GC88RUtyMRLGJASgxtWn/9CslQaRUaXL0KWGSrEmGrLJlWp\\njjrXMVZ4UHZhTJVOD8oBiPF1nt1rpuL6pS/h6BQ1D1Ac5XdCJzGfRDNfCHYF+jUy\\ns4jkPXWVSzVzhZY+IwUR5gL/FegGlYEar+Ieao+xWaPBdEF0hGRiyo06AL+Dc8Ft\\nGmrgsZDrSxAKfdPHyF/Tpn67qxddeobyK+n5XQdQ6QKBgQDT8yAnOTLID1dxmZ69\\n3O7NwQkOsPLla1XqXP5XDRA0FDGUzqbeUAx4+Jcb/ylk3mQpL9/JK/cAqDG8Uou2\\nfM86vI+CwqbBUhgR+J6DA7ZFykb1EEr4x0sgf70QmIkEwwZ0hByDijfHYUqwaXjp\\n2tBHDZU8iaQDB1bCfTDB3qbYfQKBgQC6AtV40rZxJ4Zj+6SyQyPDPrBqHPC00kyG\\nGL9UWbRgiLcF8gzV3r4pICVwGo34P6ULGrZL2QrTWdmTVyEEI2z/fI0BU9P6msWe\\nOndHV+jvott4ns74uV3G//myv1banVGZ4758diHU1xxT7KtWaQnuAbBhm9ME/GWW\\nUL05vWQxcwKBgQCtpHYnLFlKRidhznWbHzIWJ5wACUA2bOWKiH1nXDB2OkUUoOld\\nIT/Wq/NA4J9NIFX22F4DNp26UBHPM+F6tG4itPDuNALiRxupPYK/236tVrcjdyG1\\nB7GpAn4m5pD68byMIOArdEWWd0L1nLOPA9G3JI2rdyiDwrN1y5LygjM3EQKBgBDm\\n3wTaiK9hewmsvPthtGcyVA9gT9LuZPuuVfxRJl27Ln5Azz/DvJ26CQzVrN7I0bNf\\nmv7rWtt3h5imyx44JdhVNe7P8iwMUjadc2ctKsJTlwOv0nixRz8k1UiTsE2vC9Ii\\n6pUemtZfMXjCwZLZeoiA6MkFwrfqQ0TUU01i0y7XAoGAZutAt4k5dmRZ2EXIbCTx\\n7RfCdibEXfQqJu1KsBjD1OOWRGo3cAPaLzPUA78F5P/a3f8KnoCoHT0OsZfqiiyZ\\nqO5gc6imwalwj23Ue+0lYtpk67N6PMmTj9cd/8TCdBxyV2DzIeQEBE+MCTSsRw+R\\n+Gv7cJbTCDiVD7oKaAsqnaA=\\n-----END PRIVATE KEY-----"
`;

const targetPath = path.join(__dirname, '../../.env');

fs.writeFileSync(targetPath, envContent);
console.log('Successfully updated .env file with correct Sheet ID and Credentials at', targetPath);
