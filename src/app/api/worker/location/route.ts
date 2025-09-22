import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { latitude, longitude, timestamp, accuracy } = body;

    // Validează datele primite
    if (!latitude || !longitude || !timestamp) {
      return NextResponse.json(
        { success: false, error: 'Missing required location data' },
        { status: 400 }
      );
    }

    console.log('📍 Worker location received:', {
      latitude,
      longitude,
      timestamp,
      accuracy,
      receivedAt: new Date().toISOString()
    });

    // Aici poți salva locația în baza de date
    // Pentru moment, doar logăm datele
    
    // Simulează salvarea în DB
    const locationRecord = {
      id: `location_${Date.now()}`,
      workerId: 'current_worker', // În viitor, ia din session/token
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date(timestamp),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      receivedAt: new Date(),
    };

    // TODO: Salvează în baza de date
    // await prisma.workerLocation.create({ data: locationRecord });

    console.log('✅ Worker location processed successfully:', locationRecord);

    return NextResponse.json({
      success: true,
      message: 'Location received successfully',
      data: locationRecord
    });

  } catch (error) {
    console.error('❌ Error processing worker location:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Returnează locațiile recente pentru worker-ul curent
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId') || 'current_worker';
    const hours = parseInt(searchParams.get('hours') || '24');

    console.log(`📍 Fetching locations for worker ${workerId} (last ${hours} hours)`);

    // TODO: Obține din baza de date
    // const locations = await prisma.workerLocation.findMany({
    //   where: {
    //     workerId,
    //     timestamp: {
    //       gte: new Date(Date.now() - hours * 60 * 60 * 1000)
    //     }
    //   },
    //   orderBy: { timestamp: 'desc' }
    // });

    // Pentru moment, returnează date mock
    const mockLocations = [
      {
        id: 'loc_1',
        workerId,
        latitude: 44.4268,
        longitude: 26.1025,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        accuracy: 10
      },
      {
        id: 'loc_2',
        workerId,
        latitude: 44.4320,
        longitude: 26.1030,
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        accuracy: 15
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockLocations,
      count: mockLocations.length
    });

  } catch (error) {
    console.error('❌ Error fetching worker locations:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}