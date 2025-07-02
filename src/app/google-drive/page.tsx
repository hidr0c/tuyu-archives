'use client';

import React from 'react';
import GoogleDrivePlayer from '../../components/GoogleDrivePlayer';

export default function GoogleDrivePage() {
    return (
        <div>
            <GoogleDrivePlayer
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY}
                folderId={process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID}
                enableSearch={true}
            />
        </div>
    );
}
